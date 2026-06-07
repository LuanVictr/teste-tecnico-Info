import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockUser = { userId: 1, email: 'aivacol@aivacol.com' };

const makeVehicle = (overrides = {}) => ({
  id: 1,
  license_plate: 'ABC1D23',
  chassis: '9BWZZZ377VT004251',
  renavam: '01234567890',
  year: 2023,
  model_id: 1,
  ...overrides,
});

describe('VehiclesController', () => {
  let controller: VehiclesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [{ provide: VehiclesService, useValue: mockService }],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
    jest.clearAllMocks();
  });

  describe('POST /vehicles', () => {
    it('returns created vehicle', async () => {
      const vehicle = makeVehicle();
      mockService.create.mockResolvedValue(vehicle);

      const result = await controller.create(
        { license_plate: 'ABC1D23', chassis: '9BWZZZ377VT004251', renavam: '01234567890', year: 2023, model_id: 1 },
        mockUser,
      );

      expect(result).toEqual(vehicle);
      expect(mockService.create).toHaveBeenCalledWith(expect.any(Object), mockUser.userId);
    });

    it('propagates 404 when model not found', async () => {
      mockService.create.mockRejectedValue(new NotFoundException());

      await expect(
        controller.create(
          { license_plate: 'ABC1D23', chassis: '9BWZZZ377VT004251', renavam: '01234567890', year: 2023, model_id: 99 },
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('propagates 409 on duplicate unique field', async () => {
      mockService.create.mockRejectedValue(new ConflictException('Placa já cadastrada'));

      await expect(
        controller.create(
          { license_plate: 'ABC1D23', chassis: '9BWZZZ377VT004251', renavam: '01234567890', year: 2023, model_id: 1 },
          mockUser,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('GET /vehicles', () => {
    it('returns paginated list with meta', async () => {
      const paginated = {
        data: [makeVehicle()],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      mockService.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll({ page: 1, limit: 20 }) as typeof paginated;

      expect(result.meta).toBeDefined();
      expect(result.data).toHaveLength(1);
    });

    it('passes modelId and year filters to service', async () => {
      mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } });

      await controller.findAll({ page: 1, limit: 20, modelId: 3, year: 2022 });

      expect(mockService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ modelId: 3, year: 2022 }),
      );
    });
  });

  describe('GET /vehicles/:id', () => {
    it('returns vehicle when found', async () => {
      mockService.findOne.mockResolvedValue(makeVehicle());

      const result = await controller.findOne(1);

      expect(result.id).toBe(1);
    });

    it('throws NotFoundException when vehicle not found', async () => {
      mockService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /vehicles/:id', () => {
    it('returns updated vehicle', async () => {
      mockService.update.mockResolvedValue(makeVehicle({ year: 2024 }));

      const result = await controller.update(1, { year: 2024 }, mockUser);

      expect(result.year).toBe(2024);
    });
  });

  describe('DELETE /vehicles/:id', () => {
    it('returns success message on deletion', async () => {
      mockService.remove.mockResolvedValue({ message: 'Veículo removido com sucesso' });

      const result = await controller.remove(1);

      expect((result as { message: string }).message).toBeDefined();
    });
  });
});
