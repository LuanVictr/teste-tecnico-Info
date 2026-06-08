import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../brands/brands.entity';
import { Model } from '../models/models.entity';

const BRANDS = [
  { name: 'Volkswagen' },
  { name: 'Fiat' },
  { name: 'Chevrolet' },
];

const MODELS = [
  { name: 'Gol', brandName: 'Volkswagen' },
  { name: 'Uno', brandName: 'Fiat' },
  { name: 'Onix', brandName: 'Chevrolet' },
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,
  ) {}

  async onModuleInit(): Promise<void> {
    const brandsCreated = await this.seedBrands();
    await this.seedModels(brandsCreated);
  }

  private async seedBrands(): Promise<Map<string, Brand>> {
    const map = new Map<string, Brand>();
    for (const data of BRANDS) {
      let brand = await this.brandRepository.findOne({ where: { name: data.name } });
      if (!brand) {
        brand = await this.brandRepository.save(this.brandRepository.create(data));
        this.logger.log(`Seed: marca '${brand.name}' criada (id=${brand.id})`);
      }
      map.set(brand.name, brand);
    }
    return map;
  }

  private async seedModels(brands: Map<string, Brand>): Promise<void> {
    for (const data of MODELS) {
      const brand = brands.get(data.brandName)!;
      const exists = await this.modelRepository.findOne({
        where: { name: data.name, brand_id: brand.id },
      });
      if (!exists) {
        const model = await this.modelRepository.save(
          this.modelRepository.create({ name: data.name, brand_id: brand.id }),
        );
        this.logger.log(`Seed: modelo '${model.name}' criado (id=${model.id}, brand_id=${brand.id})`);
      }
    }
  }
}
