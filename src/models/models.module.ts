import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Model } from './models.entity';
import { ModelsService } from './models.service';
import { ModelsController } from './models.controller';
import { MessagingModule } from '../shared/messaging/messaging.module';

@Module({
  imports: [TypeOrmModule.forFeature([Model]), MessagingModule],
  controllers: [ModelsController],
  providers: [ModelsService],
  exports: [ModelsService],
})
export class ModelsModule {}
