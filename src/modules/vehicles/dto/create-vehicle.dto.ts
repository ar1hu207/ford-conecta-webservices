import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: '9BFZK54P5J8000001', maxLength: 17, description: 'VIN (até 17 caracteres)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(17)
  vin: string;

  @ApiProperty({ example: 'Ranger', maxLength: 60 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  model: string;

  @ApiProperty({ example: 2024 })
  @IsInt()
  @Min(1990)
  @Max(2100)
  modelYear: number;

  @ApiProperty({ example: '2024-03-15', description: 'Data da compra (YYYY-MM-DD)' })
  @IsDateString()
  purchaseDate: string;

  @ApiPropertyOptional({ example: 12000, default: 0, description: 'Hodômetro (km)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  odometer?: number;

  @ApiProperty({ description: 'ID (UUID) do cliente dono do veículo' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ description: 'ID (UUID) da concessionária da compra' })
  @IsOptional()
  @IsUUID()
  dealershipId?: string;
}
