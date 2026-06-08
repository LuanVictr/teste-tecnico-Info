import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'audit_logs', timestamps: false, versionKey: false })
export class AuditLog extends Document {
  @Prop({ required: true })
  entity: string;

  @Prop({ required: true })
  action: string;

  @Prop({ type: Object })
  payload: Record<string, unknown>;

  @Prop({ required: true })
  userId: number;

  @Prop({ default: () => new Date() })
  timestamp: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
