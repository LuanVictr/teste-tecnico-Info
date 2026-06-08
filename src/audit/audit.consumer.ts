import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { AuditLogRepository } from './audit-log.repository';

const EXCHANGE = 'fleet.events';
const QUEUE = 'audit_queue';

@Injectable()
export class AuditConsumer implements OnModuleInit {
  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const conn = await amqp.connect(this.config.getOrThrow<string>('RABBITMQ_URL'));
      const channel = await conn.createChannel();
      await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
      const { queue } = await channel.assertQueue(QUEUE, { durable: true });
      await channel.bindQueue(queue, EXCHANGE, '#');

      await channel.consume(queue, async (msg) => {
        if (!msg) return;
        try {
          const data = JSON.parse(msg.content.toString()) as {
            entity: string;
            action: string;
            payload: unknown;
            userId: number;
            timestamp: string;
          };
          await this.auditLogRepository.create({ ...data, timestamp: new Date(data.timestamp) });
          channel.ack(msg);
        } catch {
          channel.nack(msg, false, false);
        }
      });
    } catch {
      // RabbitMQ unavailable — audit is non-blocking
    }
  }
}
