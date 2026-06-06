import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from './models.entity';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { ListModelsDto } from './dto/list-models.dto';
import { paginate } from '../shared/pagination/paginate.helper';

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(Model)
    private readonly repo: Repository<Model>,
  ) {}

  async create(dto: CreateModelDto, userId: number) {
    const model = this.repo.create({ ...dto, created_by: userId });
    return this.repo.save(model);
  }

  async findAll(dto: ListModelsDto) {
    const [items, total] = await this.repo.findAndCount({
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
      order: { created_at: 'DESC' },
    });
    return paginate(items, total, dto.page, dto.limit);
  }

  async findOne(id: number) {
    const model = await this.repo.findOne({ where: { id } });
    if (!model) throw new NotFoundException(`Modelo com id ${id} não encontrado`);
    return model;
  }

  async update(id: number, dto: UpdateModelDto, userId: number) {
    const model = await this.findOne(id);
    Object.assign(model, { ...dto, updated_by: userId });
    return this.repo.save(model);
  }

  async remove(id: number) {
    const model = await this.findOne(id);
    const vehicleCount = await this.repo.manager
      .getRepository('Vehicle')
      .count({ where: { model_id: id } });

    if (vehicleCount > 0) {
      throw new ConflictException(
        `Cannot delete model: ${vehicleCount} vehicle(s) are still associated with this model.`,
      );
    }

    await this.repo.remove(model);
    return { message: 'Modelo removido com sucesso' };
  }
}
