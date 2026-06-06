import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 1,
  email: 'aivacol@aivacol.com',
  password: 'hashedpassword',
  nickname: 'aivacol',
  name: 'Aivacol Admin',
};

const mockUsersService = {
  findByEmailWithPassword: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('returns user data (without password) when credentials are valid', async () => {
      const hash = await bcrypt.hash('secret123', 10);
      mockUsersService.findByEmailWithPassword.mockResolvedValue({
        ...mockUser,
        password: hash,
      });

      const result = await service.validateUser('aivacol@aivacol.com', 'secret123');

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.email).toBe('aivacol@aivacol.com');
      expect(result).not.toHaveProperty('password');
    });

    it('returns null when user is not found', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValue(null);

      const result = await service.validateUser('notfound@test.com', 'anypass');

      expect(result).toBeNull();
    });

    it('returns null when password does not match', async () => {
      const hash = await bcrypt.hash('correctpassword', 10);
      mockUsersService.findByEmailWithPassword.mockResolvedValue({
        ...mockUser,
        password: hash,
      });

      const result = await service.validateUser('aivacol@aivacol.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('returns access_token signed with userId and email', () => {
      const user = { id: 1, email: 'aivacol@aivacol.com', nickname: 'aivacol' };

      const result = service.login(user);

      expect(result).toEqual({ access_token: 'mock.jwt.token' });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
      });
    });
  });
});
