import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './brands.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { ListBrandsDto } from './dto/list-brands.dto';
import { paginate } from '../shared/pagination/paginate.helper';
import { EventPublisherService } from '../shared/messaging/event-publisher.service';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async create(data: CreateBrandDto, userId: number) {
    const existing = await this.brandRepository.findOne({ where: { name: data.name } });
    if (existing) throw new ConflictException(`Marca '${data.name}' já cadastrada`);

    const brand = this.brandRepository.create({ ...data, created_by: userId });
    const saved = await this.brandRepository.save(brand);
    this.eventPublisher.publish('brand', 'created', saved, userId);
    return saved;
  }

  async findAll(filters: ListBrandsDto) {
    const [brands, total] = await this.brandRepository.findAndCount({
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      order: { name: 'ASC' },
    });
    return paginate(brands, total, filters.page, filters.limit);
  }

  async findOne(id: number) {
    const brand = await this.brandRepository.findOne({
      where: { id },
      relations: { models: true },
    });
    if (!brand) throw new NotFoundException(`Marca com id ${id} não encontrada`);
    return brand;
  }

  async update(id: number, changes: UpdateBrandDto, _userId: number) {
    const brand = await this.findOne(id);

    if (changes.name && changes.name !== brand.name) {
      const existing = await this.brandRepository.findOne({ where: { name: changes.name } });
      if (existing) throw new ConflictException(`Marca '${changes.name}' já cadastrada`);
    }

    Object.assign(brand, changes);
    const updated = await this.brandRepository.save(brand);
    this.eventPublisher.publish('brand', 'updated', updated, _userId);
    return updated;
  }

  async remove(id: number) {
    const brand = await this.findOne(id);
    const modelCount = await this.brandRepository.manager
      .getRepository('Model')
      .count({ where: { brand_id: id } });

    if (modelCount) {
      throw new ConflictException(
        `Cannot delete brand: ${modelCount} model(s) are still associated with this brand.`,
      );
    }

    await this.brandRepository.softRemove(brand);
    this.eventPublisher.publish('brand', 'deleted', { id }, 0);
    return { message: 'Marca removida com sucesso' };
  }
}
