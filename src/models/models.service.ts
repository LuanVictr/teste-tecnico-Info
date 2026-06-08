import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from './models.entity';
import { Brand } from '../brands/brands.entity';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { ListModelsDto } from './dto/list-models.dto';
import { paginate } from '../shared/pagination/paginate.helper';

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,
  ) {}

  async create(data: CreateModelDto, userId: number) {
    if (data.brand_id) await this.assertBrandExists(data.brand_id);
    await this.assertNameAvailable(data.name, data.brand_id);
    const model = this.modelRepository.create({ ...data, created_by: userId });
    return this.modelRepository.save(model);
  }

  async findAll(filters: ListModelsDto) {
    const [models, total] = await this.modelRepository.findAndCount({
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      order: { created_at: 'DESC' },
    });
    return paginate(models, total, filters.page, filters.limit);
  }

  async findOne(id: number) {
    const model = await this.modelRepository.findOne({ where: { id } });
    if (!model) throw new NotFoundException(`Modelo com id ${id} não encontrado`);
    return model;
  }

  async update(id: number, changes: UpdateModelDto, _userId: number) {
    if (changes.brand_id) await this.assertBrandExists(changes.brand_id);
    const model = await this.findOne(id);
    if (changes.name !== undefined || changes.brand_id !== undefined) {
      const name = changes.name ?? model.name;
      const brandId = changes.brand_id !== undefined ? changes.brand_id : model.brand_id;
      await this.assertNameAvailable(name, brandId, id);
    }
    Object.assign(model, changes);
    return this.modelRepository.save(model);
  }

  async remove(id: number) {
    const model = await this.findOne(id);
    const vehicleCount = await this.modelRepository.manager
      .getRepository('Vehicle')
      .count({ where: { model_id: id } });

    if (vehicleCount) {
      throw new ConflictException(
        `Cannot delete model: ${vehicleCount} vehicle(s) are still associated with this model.`,
      );
    }

    await this.modelRepository.softRemove(model);
    return { message: 'Modelo removido com sucesso' };
  }

  private async assertNameAvailable(name: string, brandId: number | null | undefined, excludeId?: number): Promise<void> {
    const existing = await this.modelRepository.findOne({
      where: { name, brand_id: brandId ?? null },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        brandId
          ? `Modelo '${name}' já existe para esta marca`
          : `Modelo '${name}' já existe sem marca associada`,
      );
    }
  }

  private async assertBrandExists(brandId: number): Promise<void> {
    const brand = await this.modelRepository.manager
      .getRepository(Brand)
      .findOne({ where: { id: brandId } });
    if (!brand) throw new NotFoundException(`Marca com id ${brandId} não encontrada`);
  }
}
