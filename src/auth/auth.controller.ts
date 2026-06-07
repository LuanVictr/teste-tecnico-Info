import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

@ApiTags('🔐 Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Autenticar usuário',
    description:
      'Autentica com email e senha e retorna um JWT. Use o token retornado no header `Authorization: Bearer <token>` em todas as demais requisições.',
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticação bem-sucedida',
    schema: {
      example: { access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos (email ou senha ausentes)' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() credentials: LoginDto) {
    const user = await this.authService.validateUser(credentials.email, credentials.password);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    return this.authService.login(user);
  }
}
