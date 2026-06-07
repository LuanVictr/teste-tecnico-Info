import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Min } from 'class-validator';
import { PaginationDto } from '../../shared/pagination/pagination.dto';

export class ListVehiclesDto extends PaginationDto {
  @ApiPropertyOptional({ example: 1, description: 'Filtrar por ID do modelo' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  modelId?: number;

  @ApiPropertyOptional({ example: 2023, description: 'Filtrar por ano de fabricação' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  year?: number;
}
