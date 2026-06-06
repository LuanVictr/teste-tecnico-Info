import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateModelDto {
  @ApiProperty({ example: 'Gol', description: 'Nome do modelo de veículo' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @ApiPropertyOptional({ example: 1, description: 'ID da marca (opcional)' })
  @IsOptional()
  @IsInt({ message: 'brand_id deve ser um número inteiro' })
  @IsPositive({ message: 'brand_id deve ser positivo' })
  brand_id?: number;
}
