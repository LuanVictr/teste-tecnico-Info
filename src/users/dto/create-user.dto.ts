import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'joao', description: 'Nome curto / apelido (máx. 50 caracteres)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  nickname: string;

  @ApiProperty({ example: 'João Silva', description: 'Nome completo (máx. 150 caracteres)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'joao@example.com', description: 'Email único do usuário' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ example: 'Senha@123', description: 'Senha (mínimo 6 caracteres)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;
}
