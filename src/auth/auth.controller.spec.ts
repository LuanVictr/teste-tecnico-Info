import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  validateUser: jest.fn(),
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('returns access_token on valid credentials', async () => {
      const user = { id: 1, email: 'aivacol@aivacol.com' };
      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockResolvedValue({ access_token: 'jwt.token.here' });

      const result = await controller.login({
        email: 'aivacol@aivacol.com',
        password: 'secret123',
      });

      expect(result).toEqual({ access_token: 'jwt.token.here' });
    });

    it('throws UnauthorizedException on invalid credentials', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(
        controller.login({ email: 'wrong@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('calls validateUser with provided credentials', async () => {
      const user = { id: 1, email: 'test@test.com' };
      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockResolvedValue({ access_token: 'token' });

      await controller.login({ email: 'test@test.com', password: 'pass123' });

      expect(mockAuthService.validateUser).toHaveBeenCalledWith('test@test.com', 'pass123');
    });
  });
});
