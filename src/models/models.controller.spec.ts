import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ModelsController } from './models.controller';
import { ModelsService } from './models.service';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockUser = { userId: 1, email: 'aivacol@aivacol.com' };

describe('ModelsController', () => {
  let controller: ModelsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModelsController],
      providers: [{ provide: ModelsService, useValue: mockService }],
    }).compile();

    controller = module.get<ModelsController>(ModelsController);
    jest.clearAllMocks();
  });

  describe('POST /models', () => {
    it('returns 201 with created model', async () => {
      const dto = { name: 'Gol' };
      const model = { id: 1, name: 'Gol', created_at: new Date(), updated_at: new Date() };
      mockService.create.mockResolvedValue(model);

      const result = await controller.create(dto, mockUser);

      expect(result).toEqual(model);
      expect(mockService.create).toHaveBeenCalledWith(dto, mockUser.userId);
    });
  });

  describe('GET /models', () => {
    it('returns paginated list', async () => {
      const paginated = {
        data: [{ id: 1, name: 'Gol' }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      mockService.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll({ page: 1, limit: 20 });

      expect(result.meta).toBeDefined();
      expect(result.data).toHaveLength(1);
    });
  });

  describe('GET /models/:id', () => {
    it('returns model when found', async () => {
      mockService.findOne.mockResolvedValue({ id: 1, name: 'Gol' });

      const result = await controller.findOne(1);

      expect(result.id).toBe(1);
    });

    it('throws NotFoundException when not found', async () => {
      mockService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /models/:id', () => {
    it('returns updated model', async () => {
      mockService.update.mockResolvedValue({ id: 1, name: 'Gol G7' });

      const result = await controller.update(1, { name: 'Gol G7' }, mockUser);

      expect(result.name).toBe('Gol G7');
    });
  });

  describe('DELETE /models/:id', () => {
    it('throws ConflictException with descriptive message when vehicles associated', async () => {
      mockService.remove.mockRejectedValue(
        new ConflictException(
          'Cannot delete model: 3 vehicle(s) are still associated with this model.',
        ),
      );

      await expect(controller.remove(1)).rejects.toThrow(ConflictException);
    });

    it('returns success message when no vehicles', async () => {
      mockService.remove.mockResolvedValue({ message: 'Modelo removido com sucesso' });

      const result = await controller.remove(1);

      expect(result.message).toBeDefined();
    });
  });
});
