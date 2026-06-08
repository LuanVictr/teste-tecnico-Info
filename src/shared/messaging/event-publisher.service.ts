import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

const EXCHANGE = 'fleet.events';

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  channel: amqp.Channel | null = null;
  private connection: amqp.Connection | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.config.getOrThrow<string>('RABBITMQ_URL'));
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    } catch {
      // RabbitMQ unavailable — messaging is non-blocking
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {}
  }

  publish(entity: string, action: string, payload: unknown, userId: number): void {
    try {
      if (!this.channel) return;
      const message = JSON.stringify({ entity, action, payload, userId, timestamp: new Date() });
      this.channel.publish(EXCHANGE, `${entity}.${action}`, Buffer.from(message), {
        persistent: true,
      });
    } catch {
      // Non-blocking: publish failure must not affect the primary operation
    }
  }
}
