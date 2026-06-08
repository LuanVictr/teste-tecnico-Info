import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLog, AuditLogSchema } from './audit-log.schema';
import { AuditLogRepository } from './audit-log.repository';
import { AuditConsumer } from './audit.consumer';

@Module({
  imports: [MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }])],
  providers: [AuditLogRepository, AuditConsumer],
  exports: [AuditLogRepository],
})
export class AuditModule {}
