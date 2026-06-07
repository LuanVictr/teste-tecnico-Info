import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const MAX_YEAR = new Date().getFullYear() + 1;

export class CreateVehicleDto {
  @ApiProperty({ example: 'ABC1D23', description: 'Placa do veículo (formato antigo ou Mercosul)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  license_plate: string;

  @ApiProperty({ example: '9BWZZZ377VT004251', description: 'Chassi VIN (17 caracteres)' })
  @IsNotEmpty()
  @IsString()
  @Length(17, 17, { message: 'Chassi deve ter exatamente 17 caracteres' })
  chassis: string;

  @ApiProperty({ example: '01234567890', description: 'RENAVAM (11 dígitos)' })
  @IsNotEmpty()
  @IsString()
  @Length(11, 11, { message: 'RENAVAM deve ter exatamente 11 caracteres' })
  renavam: string;

  @ApiProperty({ example: 2023, description: 'Ano de fabricação (1900 até ano atual + 1)' })
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(MAX_YEAR)
  year: number;

  @ApiPropertyOptional({ example: 1, description: 'ID do modelo do veículo' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  model_id: number;
}
