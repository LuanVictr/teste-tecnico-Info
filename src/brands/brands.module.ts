import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './brands.entity';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { MessagingModule } from '../shared/messaging/messaging.module';

@Module({
  imports: [TypeOrmModule.forFeature([Brand]), MessagingModule],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {}
