import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './vehicles.entity';

const mockModelRepository = { findOne: jest.fn() };

const mockVehicleRepository = {
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softRemove: jest.fn(),
  manager: {
    getRepository: jest.fn().mockReturnValue(mockModelRepository),
  },
};

const mockCacheManager = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  store: { keys: jest.fn().mockResolvedValue([]) },
};

const makeVehicle = (overrides = {}) => ({
  id: 1,
  license_plate: 'ABC1D23',
  chassis: '9BWZZZ377VT004251',
  renavam: '01234567890',
  year: 2023,
  model_id: 1,
  created_by: 1,
  ...overrides,
});

describe('VehiclesService', () => {
  let service: VehiclesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: getRepositoryToken(Vehicle), useValue: mockVehicleRepository },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    jest.clearAllMocks();
    mockCacheManager.get.mockResolvedValue(null);
    mockCacheManager.store.keys.mockResolvedValue([]);
  });

  describe('create', () => {
    it('returns created vehicle with all fields', async () => {
      const vehicle = makeVehicle();
      mockModelRepository.findOne.mockResolvedValue({ id: 1, name: 'Gol' });
      mockVehicleRepository.create.mockReturnValue(vehicle);
      mockVehicleRepository.save.mockResolvedValue(vehicle);

      const result = await service.create(
        { license_plate: 'ABC1D23', chassis: '9BWZZZ377VT004251', renavam: '01234567890', year: 2023, model_id: 1 },
        1,
      );

      expect(result).toEqual(vehicle);
      expect(mockVehicleRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ created_by: 1 }),
      );
    });

    it('throws NotFoundException when model_id does not exist', async () => {
      mockModelRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create(
          { license_plate: 'ABC1D23', chassis: '9BWZZZ377VT004251', renavam: '01234567890', year: 2023, model_id: 99 },
          1,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException on duplicate license_plate', async () => {
      mockModelRepository.findOne.mockResolvedValue({ id: 1 });
      mockVehicleRepository.create.mockReturnValue({});
      mockVehicleRepository.save.mockRejectedValue({
        number: 2627,
        message: "Violation of UNIQUE KEY constraint 'UQ_vehicles_license_plate'",
      });

      await expect(
        service.create(
          { license_plate: 'ABC1D23', chassis: '9BWZZZ377VT004251', renavam: '01234567890', year: 2023, model_id: 1 },
          1,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException on duplicate chassis', async () => {
      mockModelRepository.findOne.mockResolvedValue({ id: 1 });
      mockVehicleRepository.create.mockReturnValue({});
      mockVehicleRepository.save.mockRejectedValue({
        number: 2601,
        message: "Violation of UNIQUE KEY constraint 'UQ_vehicles_chassis'",
      });

      await expect(
        service.create(
          { license_plate: 'XYZ1234', chassis: '9BWZZZ377VT004251', renavam: '01234567890', year: 2023, model_id: 1 },
          1,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('queries database and caches result on cache miss', async () => {
      const vehicles = [makeVehicle()];
      mockCacheManager.get.mockResolvedValue(null);
      mockVehicleRepository.findAndCount.mockResolvedValue([vehicles, 1]);

      const result = await service.findAll({ page: 1, limit: 20 }) as { data: typeof vehicles; meta: { total: number; page: number; limit: number } };

      expect(mockVehicleRepository.findAndCount).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalled();
      expect(result.data).toEqual(vehicles);
      expect(result.meta).toMatchObject({ total: 1, page: 1, limit: 20 });
    });

    it('returns cached result without hitting database', async () => {
      const cached = { data: [makeVehicle()], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } };
      mockCacheManager.get.mockResolvedValue(cached);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toEqual(cached);
      expect(mockVehicleRepository.findAndCount).not.toHaveBeenCalled();
    });

    it('applies modelId filter when provided', async () => {
      mockVehicleRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 20, modelId: 5 });

      expect(mockVehicleRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ model_id: 5 }) }),
      );
    });

    it('applies year filter when provided', async () => {
      mockVehicleRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 20, year: 2022 });

      expect(mockVehicleRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ year: 2022 }) }),
      );
    });
  });

  describe('findOne', () => {
    it('returns vehicle from database and stores in cache on miss', async () => {
      const vehicle = makeVehicle();
      mockCacheManager.get.mockResolvedValue(null);
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);

      const result = await service.findOne(1);

      expect(result).toEqual(vehicle);
      expect(mockCacheManager.set).toHaveBeenCalledWith('vehicles:detail:1', vehicle);
    });

    it('returns cached vehicle without hitting database', async () => {
      const cached = makeVehicle();
      mockCacheManager.get.mockResolvedValue(cached);

      const result = await service.findOne(1);

      expect(result).toEqual(cached);
      expect(mockVehicleRepository.findOne).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when vehicle does not exist', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockVehicleRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates vehicle and invalidates cache', async () => {
      const vehicle = makeVehicle();
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);
      mockVehicleRepository.save.mockResolvedValue({ ...vehicle, year: 2024 });

      const result = await service.update(1, { year: 2024 }, 1);

      expect(result.year).toBe(2024);
      expect(mockCacheManager.del).toHaveBeenCalledWith('vehicles:detail:1');
    });

    it('validates new model_id on update', async () => {
      mockModelRepository.findOne.mockResolvedValue(null);

      await expect(service.update(1, { model_id: 99 }, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft deletes vehicle and invalidates cache', async () => {
      const vehicle = makeVehicle();
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);
      mockVehicleRepository.softRemove.mockResolvedValue(vehicle);

      const result = await service.remove(1);

      expect(mockVehicleRepository.softRemove).toHaveBeenCalledWith(vehicle);
      expect(mockCacheManager.del).toHaveBeenCalledWith('vehicles:detail:1');
      expect((result as { message: string }).message).toBeDefined();
    });

    it('throws NotFoundException when vehicle does not exist', async () => {
      mockVehicleRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
