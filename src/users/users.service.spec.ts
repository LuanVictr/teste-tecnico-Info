import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './users.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

const mockUserRepository = {
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softRemove: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockConfigService = {
  getOrThrow: jest.fn((key: string) => {
    const values: Record<string, string> = {
      SEED_USER_EMAIL: 'aivacol@aivacol.com',
      SEED_USER_PASSWORD: 'aivacol@123',
      SEED_USER_NICKNAME: 'aivacol',
      SEED_USER_NAME: 'Aivacol Admin',
      BCRYPT_SALT_ROUNDS: '10',
    };
    return values[key];
  }),
  get: jest.fn((key: string, fallback?: string) => {
    const values: Record<string, string> = { BCRYPT_SALT_ROUNDS: '10' };
    return values[key] ?? fallback;
  }),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
  });

  describe('create', () => {
    it('hashes password before saving', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ id: 1, email: 'joao@test.com' });
      mockUserRepository.save.mockResolvedValue({ id: 1, email: 'joao@test.com' });

      await service.create({
        nickname: 'joao',
        name: 'João Silva',
        email: 'joao@test.com',
        password: 'plain_password',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('plain_password', 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed_password' }),
      );
    });

    it('throws ConflictException when email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 1, email: 'joao@test.com' });

      await expect(
        service.create({ nickname: 'joao', name: 'João', email: 'joao@test.com', password: '123456' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns paginated users without password field', async () => {
      const users = [{ id: 1, email: 'joao@test.com', nickname: 'joao' }];
      mockUserRepository.findAndCount.mockResolvedValue([users, 1]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual(users);
      expect(result.meta).toMatchObject({ total: 1, page: 1, limit: 20 });
      result.data.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      const user = { id: 1, nickname: 'joao', email: 'joao@test.com' };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findById(1);

      expect(result).toEqual(user);
    });

    it('throws NotFoundException when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('rehashes password when a new password is provided', async () => {
      const user = { id: 1, name: 'João', email: 'joao@test.com' };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue({ ...user, name: 'João Atualizado' });

      await service.update(1, { name: 'João Atualizado', password: 'new_password' });

      expect(bcrypt.hash).toHaveBeenCalledWith('new_password', 10);
    });

    it('does not call bcrypt when password is not being updated', async () => {
      const user = { id: 1, name: 'João' };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue({ ...user, name: 'João Atualizado' });

      await service.update(1, { name: 'João Atualizado' });

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.update(99, { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('calls softRemove and returns success message', async () => {
      const user = { id: 1, nickname: 'joao' };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.softRemove.mockResolvedValue(user);

      const result = await service.remove(1);

      expect(mockUserRepository.softRemove).toHaveBeenCalledWith(user);
      expect((result as { message: string }).message).toBeDefined();
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });
});
