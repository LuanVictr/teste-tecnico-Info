import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { Brand } from './brands.entity';
import { EventPublisherService } from '../shared/messaging/event-publisher.service';

const mockModelRepository = { count: jest.fn() };

const mockBrandRepository = {
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softRemove: jest.fn(),
  manager: {
    getRepository: jest.fn().mockReturnValue(mockModelRepository),
  },
};

describe('BrandsService', () => {
  let service: BrandsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        { provide: getRepositoryToken(Brand), useValue: mockBrandRepository },
        { provide: EventPublisherService, useValue: { publish: jest.fn() } },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates brand and returns it', async () => {
      const brand = { id: 1, name: 'Volkswagen' };
      mockBrandRepository.findOne.mockResolvedValue(null);
      mockBrandRepository.create.mockReturnValue(brand);
      mockBrandRepository.save.mockResolvedValue(brand);

      const result = await service.create({ name: 'Volkswagen' }, 1);

      expect(result).toEqual(brand);
      expect(mockBrandRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Volkswagen', created_by: 1 }),
      );
    });

    it('throws ConflictException when brand name already exists', async () => {
      mockBrandRepository.findOne.mockResolvedValue({ id: 1, name: 'Volkswagen' });

      await expect(service.create({ name: 'Volkswagen' }, 1)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns paginated result with meta', async () => {
      const brands = [{ id: 1, name: 'Volkswagen' }];
      mockBrandRepository.findAndCount.mockResolvedValue([brands, 1]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual(brands);
      expect(result.meta).toMatchObject({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });
  });

  describe('findOne', () => {
    it('returns brand with models when found', async () => {
      const brand = { id: 1, name: 'Volkswagen', models: [{ id: 1, name: 'Gol' }] };
      mockBrandRepository.findOne.mockResolvedValue(brand);

      const result = await service.findOne(1);

      expect(result).toEqual(brand);
      expect(mockBrandRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ relations: { models: true } }),
      );
    });

    it('throws NotFoundException when brand not found', async () => {
      mockBrandRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates and returns brand', async () => {
      const brand = { id: 1, name: 'Volkswagen', models: [] };
      mockBrandRepository.findOne
        .mockResolvedValueOnce(brand) // findOne in update
        .mockResolvedValueOnce(null); // duplicate name check
      mockBrandRepository.save.mockResolvedValue({ ...brand, name: 'VW' });

      const result = await service.update(1, { name: 'VW' }, 1);

      expect(result.name).toBe('VW');
    });

    it('throws ConflictException when new name already taken', async () => {
      mockBrandRepository.findOne
        .mockResolvedValueOnce({ id: 1, name: 'Volkswagen', models: [] }) // findOne
        .mockResolvedValueOnce({ id: 2, name: 'VW' }); // duplicate check

      await expect(service.update(1, { name: 'VW' }, 1)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('throws ConflictException with model count when models associated', async () => {
      mockBrandRepository.findOne.mockResolvedValue({ id: 1, name: 'VW', models: [] });
      mockModelRepository.count.mockResolvedValue(3);

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
      await expect(service.remove(1)).rejects.toThrow(
        'Cannot delete brand: 3 model(s) are still associated with this brand.',
      );
    });

    it('soft deletes brand when no models associated', async () => {
      const brand = { id: 1, name: 'VW', models: [] };
      mockBrandRepository.findOne.mockResolvedValue(brand);
      mockModelRepository.count.mockResolvedValue(0);
      mockBrandRepository.softRemove.mockResolvedValue(brand);

      const result = await service.remove(1);

      expect(mockBrandRepository.softRemove).toHaveBeenCalledWith(brand);
      expect((result as { message: string }).message).toBeDefined();
    });
  });
});
