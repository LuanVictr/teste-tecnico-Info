import type { Cache } from 'cache-manager';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import type { FindManyOptions } from 'typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicles.entity';
import { Model } from '../models/models.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { ListVehiclesDto } from './dto/list-vehicles.dto';
import { buildCacheKey } from '../shared/cache/cache-key.util';
import { paginate } from '../shared/pagination/paginate.helper';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async create(data: CreateVehicleDto, userId: number) {
    await this.assertModelExists(data.model_id);

    try {
      const vehicle = this.vehicleRepository.create({ ...data, created_by: userId });
      const saved = await this.vehicleRepository.save(vehicle);
      await this.invalidateListCache();
      return saved;
    } catch (error) {
      this.handleUniqueViolation(error);
      throw error;
    }
  }

  async findAll(filters: ListVehiclesDto) {
    const cacheKey = buildCacheKey('vehicles:list', { ...filters });
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const where: FindManyOptions<Vehicle>['where'] = {};
    if (filters.modelId) where.model_id = filters.modelId;
    if (filters.year) where.year = filters.year;

    const [vehicles, total] = await this.vehicleRepository.findAndCount({
      where,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      order: { created_at: 'DESC' },
      relations: { model: true },
    });

    const result = paginate(vehicles, total, filters.page, filters.limit);
    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  async findOne(id: number) {
    const cacheKey = `vehicles:detail:${id}`;
    const cached = await this.cacheManager.get<Vehicle>(cacheKey);
    if (cached) return cached;

    const vehicle = await this.loadById(id);
    await this.cacheManager.set(cacheKey, vehicle);
    return vehicle;
  }

  async update(id: number, changes: UpdateVehicleDto, _userId: number) {
    if (changes.model_id) await this.assertModelExists(changes.model_id);

    const vehicle = await this.loadById(id);
    Object.assign(vehicle, changes);

    try {
      const updated = await this.vehicleRepository.save(vehicle);
      await this.invalidateVehicleCache(id);
      return updated;
    } catch (error) {
      this.handleUniqueViolation(error);
      throw error;
    }
  }

  async remove(id: number) {
    const vehicle = await this.loadById(id);
    await this.vehicleRepository.softRemove(vehicle);
    await this.invalidateVehicleCache(id);
    return { message: 'Veículo removido com sucesso' };
  }

  private async loadById(id: number): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException(`Veículo com id ${id} não encontrado`);
    return vehicle;
  }

  private async assertModelExists(modelId: number): Promise<void> {
    const model = await this.vehicleRepository.manager
      .getRepository(Model)
      .findOne({ where: { id: modelId } });
    if (!model) throw new NotFoundException(`Modelo com id ${modelId} não encontrado`);
  }

  private async invalidateVehicleCache(id: number): Promise<void> {
    await this.cacheManager.del(`vehicles:detail:${id}`);
    await this.invalidateListCache();
  }

  private async invalidateListCache(): Promise<void> {
    try {
      const store = (
        this.cacheManager as unknown as { store: { keys(p: string): Promise<string[]> } }
      ).store;
      const listKeys = await store.keys('vehicles:list*');
      if (listKeys.length) {
        await Promise.all(listKeys.map((key) => this.cacheManager.del(key)));
      }
    } catch {}
  }

  private handleUniqueViolation(error: unknown): void {
    const mssqlError = error as { number?: number; message?: string };
    if (mssqlError.number !== 2601 && mssqlError.number !== 2627) return;

    const message = mssqlError.message ?? '';
    const conflicts: Record<string, string> = {
      UQ_vehicles_license_plate: 'Placa já cadastrada',
      UQ_vehicles_chassis: 'Chassi já cadastrado',
      UQ_vehicles_renavam: 'RENAVAM já cadastrado',
    };

    for (const [constraint, errorMessage] of Object.entries(conflicts)) {
      if (message.includes(constraint)) throw new ConflictException(errorMessage);
    }
    throw new ConflictException('Dado duplicado: verifique placa, chassi ou RENAVAM');
  }
}
