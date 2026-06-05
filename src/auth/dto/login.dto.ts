import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'aivacol@aivacol.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'aivacol@123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
