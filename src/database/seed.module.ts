import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from '../brands/brands.entity';
import { Model } from '../models/models.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Brand, Model])],
  providers: [SeedService],
})
export class SeedModule {}
