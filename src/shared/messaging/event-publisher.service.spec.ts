import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { EventPublisherService } from './event-publisher.service';

jest.mock('amqplib');

const mockChannel = {
  assertExchange: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn().mockReturnValue(true),
  close: jest.fn().mockResolvedValue(undefined),
};

const mockConnection = {
  createChannel: jest.fn().mockResolvedValue(mockChannel),
  close: jest.fn().mockResolvedValue(undefined),
};

const mockConfig = {
  getOrThrow: jest.fn().mockReturnValue('amqp://localhost'),
};

describe('EventPublisherService', () => {
  let service: EventPublisherService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventPublisherService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<EventPublisherService>(EventPublisherService);
    await service.onModuleInit();
  });

  describe('onModuleInit', () => {
    it('conecta ao RabbitMQ e cria exchange fleet.events do tipo topic', () => {
      expect(amqp.connect).toHaveBeenCalledWith('amqp://localhost');
      expect(mockChannel.assertExchange).toHaveBeenCalledWith('fleet.events', 'topic', {
        durable: true,
      });
    });

    it('não lança exceção quando RabbitMQ está indisponível', async () => {
      (amqp.connect as jest.Mock).mockRejectedValueOnce(new Error('ECONNREFUSED'));
      const fresh = new EventPublisherService(mockConfig as unknown as ConfigService);
      await expect(fresh.onModuleInit()).resolves.not.toThrow();
    });
  });

  describe('publish', () => {
    it('publica na exchange correta com routing key entity.action', () => {
      service.publish('vehicle', 'created', { id: 1 }, 42);
      expect(mockChannel.publish).toHaveBeenCalledWith(
        'fleet.events',
        'vehicle.created',
        expect.any(Buffer),
        { persistent: true },
      );
    });

    it('payload contém entity, action, userId e timestamp', () => {
      service.publish('vehicle', 'created', { id: 1 }, 42);
      const [, , buffer] = (mockChannel.publish as jest.Mock).mock.calls[0] as [
        string,
        string,
        Buffer,
        object,
      ];
      const msg = JSON.parse(buffer.toString()) as {
        entity: string;
        action: string;
        userId: number;
        timestamp: string;
      };
      expect(msg.entity).toBe('vehicle');
      expect(msg.action).toBe('created');
      expect(msg.userId).toBe(42);
      expect(msg.timestamp).toBeDefined();
    });

    it('não lança exceção quando channel é null', () => {
      (service as unknown as { channel: null }).channel = null;
      expect(() => service.publish('vehicle', 'created', {}, 1)).not.toThrow();
    });

    it('não lança exceção quando publish falha internamente', () => {
      mockChannel.publish.mockImplementationOnce(() => {
        throw new Error('channel closed');
      });
      expect(() => service.publish('vehicle', 'created', {}, 1)).not.toThrow();
    });
  });
});
