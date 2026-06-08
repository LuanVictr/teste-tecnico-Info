import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './audit-log.schema';

interface CreateAuditLogDto {
  entity: string;
  action: string;
  payload: unknown;
  userId: number;
  timestamp?: Date;
}

@Injectable()
export class AuditLogRepository {
  constructor(@InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLog>) {}

  async create(data: CreateAuditLogDto): Promise<AuditLog> {
    return this.auditLogModel.create(data);
  }
}
