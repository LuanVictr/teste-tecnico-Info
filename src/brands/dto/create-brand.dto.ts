import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({ example: 'Volkswagen', description: 'Nome da marca (único)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;
}
