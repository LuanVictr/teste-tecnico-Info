import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const makeUser = (overrides = {}) => ({
  id: 1,
  nickname: 'joao',
  name: 'João Silva',
  email: 'joao@example.com',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  describe('POST /users', () => {
    it('creates user and returns it without password', async () => {
      const user = makeUser();
      mockService.create.mockResolvedValue(user);

      const result = await controller.create({
        nickname: 'joao',
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'Senha@123',
      });

      expect(result).toEqual(user);
      expect(result).not.toHaveProperty('password');
      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'joao@example.com' }),
      );
    });

    it('propagates 409 on duplicate email', async () => {
      mockService.create.mockRejectedValue(new ConflictException("Email 'joao@example.com' já está em uso"));

      await expect(
        controller.create({ nickname: 'joao', name: 'João', email: 'joao@example.com', password: 'pass' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('GET /users', () => {
    it('returns paginated list', async () => {
      const paginated = {
        data: [makeUser()],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      mockService.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll({ page: 1, limit: 20 }) as typeof paginated;

      expect(result.meta).toBeDefined();
      expect(result.data).toHaveLength(1);
      result.data.forEach(user => expect(user).not.toHaveProperty('password'));
    });
  });

  describe('GET /users/:id', () => {
    it('returns user when found', async () => {
      mockService.findById.mockResolvedValue(makeUser());

      const result = await controller.findOne(1);

      expect(result).not.toHaveProperty('password');
    });

    it('throws NotFoundException when user not found', async () => {
      mockService.findById.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /users/:id', () => {
    it('returns updated user without password', async () => {
      mockService.update.mockResolvedValue(makeUser({ name: 'João Atualizado' }));

      const result = await controller.update(1, { name: 'João Atualizado' });

      expect(result).not.toHaveProperty('password');
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockService.update.mockRejectedValue(new NotFoundException());

      await expect(controller.update(99, { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('DELETE /users/:id', () => {
    it('returns success message on removal', async () => {
      mockService.remove.mockResolvedValue({ message: 'Usuário removido com sucesso' });

      const result = await controller.remove(1);

      expect((result as { message: string }).message).toBeDefined();
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockService.remove.mockRejectedValue(new NotFoundException());

      await expect(controller.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
