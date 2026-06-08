import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { AuditConsumer } from './audit.consumer';
import { AuditLogRepository } from './audit-log.repository';

jest.mock('amqplib');

const mockChannel = {
  assertExchange: jest.fn().mockResolvedValue(undefined),
  assertQueue: jest.fn().mockResolvedValue({ queue: 'audit_queue' }),
  bindQueue: jest.fn().mockResolvedValue(undefined),
  consume: jest.fn().mockResolvedValue(undefined),
  ack: jest.fn(),
  nack: jest.fn(),
};

const mockConnection = {
  createChannel: jest.fn().mockResolvedValue(mockChannel),
};

const mockRepo = { create: jest.fn() };

describe('AuditConsumer', () => {
  let consumer: AuditConsumer;

  beforeEach(async () => {
    jest.clearAllMocks();
    (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditConsumer,
        { provide: AuditLogRepository, useValue: mockRepo },
        { provide: ConfigService, useValue: { getOrThrow: jest.fn().mockReturnValue('amqp://localhost') } },
      ],
    }).compile();

    consumer = module.get<AuditConsumer>(AuditConsumer);
  });

  describe('onModuleInit', () => {
    it('conecta, cria exchange e vincula fila audit_queue com routing key #', async () => {
      await consumer.onModuleInit();
      expect(mockChannel.assertExchange).toHaveBeenCalledWith('fleet.events', 'topic', { durable: true });
      expect(mockChannel.assertQueue).toHaveBeenCalledWith('audit_queue', { durable: true });
      expect(mockChannel.bindQueue).toHaveBeenCalledWith('audit_queue', 'fleet.events', '#');
    });

    it('não lança exceção quando RabbitMQ está indisponível', async () => {
      (amqp.connect as jest.Mock).mockRejectedValueOnce(new Error('ECONNREFUSED'));
      await expect(consumer.onModuleInit()).resolves.not.toThrow();
    });
  });

  describe('message handler', () => {
    let capturedHandler: ((msg: amqp.ConsumeMessage | null) => Promise<void>) | null = null;

    beforeEach(async () => {
      mockChannel.consume.mockImplementationOnce(
        (_q: string, handler: (msg: amqp.ConsumeMessage | null) => Promise<void>) => {
          capturedHandler = handler;
          return Promise.resolve();
        },
      );
      await consumer.onModuleInit();
    });

    it('persiste log de auditoria com todos os campos obrigatórios', async () => {
      mockRepo.create.mockResolvedValue({});
      const payload = { entity: 'vehicle', action: 'created', payload: { id: 1 }, userId: 1, timestamp: new Date().toISOString() };
      const msg = { content: Buffer.from(JSON.stringify(payload)) };

      await capturedHandler!(msg as unknown as amqp.ConsumeMessage);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ entity: 'vehicle', action: 'created', userId: 1 }),
      );
      expect(mockChannel.ack).toHaveBeenCalledWith(msg);
    });

    it('faz nack em mensagem com JSON inválido', async () => {
      const msg = { content: Buffer.from('not-json') };
      await capturedHandler!(msg as unknown as amqp.ConsumeMessage);
      expect(mockChannel.nack).toHaveBeenCalledWith(msg, false, false);
    });

    it('ignora mensagem null sem lançar exceção', async () => {
      await expect(capturedHandler!(null)).resolves.not.toThrow();
    });
  });
});
