import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockUser = { userId: 1, email: 'aivacol@aivacol.com' };

describe('BrandsController', () => {
  let controller: BrandsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrandsController],
      providers: [{ provide: BrandsService, useValue: mockService }],
    }).compile();

    controller = module.get<BrandsController>(BrandsController);
    jest.clearAllMocks();
  });

  describe('POST /brands', () => {
    it('returns created brand', async () => {
      const brand = { id: 1, name: 'Volkswagen' };
      mockService.create.mockResolvedValue(brand);

      const result = await controller.create({ name: 'Volkswagen' }, mockUser);

      expect(result).toEqual(brand);
      expect(mockService.create).toHaveBeenCalledWith({ name: 'Volkswagen' }, mockUser.userId);
    });

    it('propagates 409 on duplicate name', async () => {
      mockService.create.mockRejectedValue(new ConflictException());

      await expect(controller.create({ name: 'Volkswagen' }, mockUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('GET /brands', () => {
    it('returns paginated list', async () => {
      const paginated = {
        data: [{ id: 1, name: 'Volkswagen' }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      mockService.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll({ page: 1, limit: 20 });

      expect(result.meta).toBeDefined();
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /brands/:id', () => {
    it('returns brand with models', async () => {
      const brand = { id: 1, name: 'Volkswagen', models: [{ id: 1, name: 'Gol' }] };
      mockService.findOne.mockResolvedValue(brand);

      const result = await controller.findOne(1);

      expect(result).toEqual(brand);
    });

    it('throws NotFoundException when brand not found', async () => {
      mockService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /brands/:id', () => {
    it('returns updated brand', async () => {
      mockService.update.mockResolvedValue({ id: 1, name: 'VW' });

      const result = await controller.update(1, { name: 'VW' }, mockUser);

      expect(result.name).toBe('VW');
    });
  });

  describe('DELETE /brands/:id', () => {
    it('throws ConflictException with model count when models associated', async () => {
      mockService.remove.mockRejectedValue(
        new ConflictException('Cannot delete brand: 2 model(s) are still associated with this brand.'),
      );

      await expect(controller.remove(1)).rejects.toThrow(ConflictException);
    });

    it('returns success message when no models associated', async () => {
      mockService.remove.mockResolvedValue({ message: 'Marca removida com sucesso' });

      const result = await controller.remove(1);

      expect((result as { message: string }).message).toBeDefined();
    });
  });
});
