import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ModelsService } from './models.service';
import { Model } from './models.entity';

const mockVehicleRepo = { count: jest.fn() };

const mockRepo = {
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  manager: {
    getRepository: jest.fn().mockReturnValue(mockVehicleRepo),
  },
};

describe('ModelsService', () => {
  let service: ModelsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModelsService, { provide: getRepositoryToken(Model), useValue: mockRepo }],
    }).compile();

    service = module.get<ModelsService>(ModelsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('returns created model with metadata', async () => {
      const dto = { name: 'Gol' };
      const saved = { id: 1, name: 'Gol', created_at: new Date(), updated_at: new Date() };
      mockRepo.create.mockReturnValue(saved);
      mockRepo.save.mockResolvedValue(saved);

      const result = await service.create(dto, 1);

      expect(result).toEqual(saved);
      expect(mockRepo.create).toHaveBeenCalledWith({ name: 'Gol', created_by: 1 });
    });
  });

  describe('findAll', () => {
    it('returns paginated result with meta', async () => {
      const models = [{ id: 1, name: 'Gol' }];
      mockRepo.findAndCount.mockResolvedValue([models, 1]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual(models);
      expect(result.meta).toMatchObject({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });
  });

  describe('findOne', () => {
    it('returns model when found', async () => {
      const model = { id: 1, name: 'Gol' };
      mockRepo.findOne.mockResolvedValue(model);

      const result = await service.findOne(1);

      expect(result).toEqual(model);
    });

    it('throws NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates and returns model', async () => {
      const model = { id: 1, name: 'Gol' };
      const updated = { ...model, name: 'Gol G7' };
      mockRepo.findOne.mockResolvedValue(model);
      mockRepo.save.mockResolvedValue(updated);

      const result = await service.update(1, { name: 'Gol G7' }, 1);

      expect(result.name).toBe('Gol G7');
    });

    it('throws NotFoundException when model not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.update(99, { name: 'X' }, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('throws ConflictException with vehicle count when vehicles exist', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 1, name: 'Gol' });
      mockVehicleRepo.count.mockResolvedValue(3);

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
      await expect(service.remove(1)).rejects.toThrow(
        'Cannot delete model: 3 vehicle(s) are still associated with this model.',
      );
    });

    it('removes model when no vehicles exist', async () => {
      const model = { id: 1, name: 'Gol' };
      mockRepo.findOne.mockResolvedValue(model);
      mockVehicleRepo.count.mockResolvedValue(0);
      mockRepo.remove.mockResolvedValue(model);

      const result = await service.remove(1);

      expect((result as { message: string }).message).toBeDefined();
    });
  });
});
