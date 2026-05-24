import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'João da Silva', maxLength: 140 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  name: string;

  @ApiProperty({ example: '12345678901', description: 'CPF (somente dígitos)' })
  @Matches(/^\d{11}$/, { message: 'document deve conter 11 dígitos numéricos' })
  document: string;

  @ApiProperty({ example: 'joao@example.com' })
  @IsEmail()
  @MaxLength(160)
  email: string;

  @ApiPropertyOptional({ example: '+5511999998888' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ example: 'São Paulo', maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  city: string;

  @ApiProperty({ example: 'SP', description: 'UF (2 letras)' })
  @IsString()
  @Length(2, 2)
  state: string;
}
