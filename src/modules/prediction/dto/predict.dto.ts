import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentMethod, PurchaseChannel } from '../enums/purchase.enums';

/**
 * Entrada da predição. IMPORTANTE: apenas features disponíveis NO MOMENTO DA COMPRA.
 * É proibido enviar comportamento futuro (revisões, gastos, tempo até manutenção):
 * isso caracterizaria data leakage (regra crítica do enunciado de ML).
 */
export class PredictDto {
  @ApiProperty({ description: 'ID (UUID) do cliente' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ description: 'ID (UUID) do veículo, se já cadastrado' })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiProperty({ example: 34, minimum: 18, maximum: 100 })
  @IsInt()
  @Min(18)
  @Max(100)
  age: number;

  @ApiProperty({ example: 7500, description: 'Renda mensal (R$) na compra' })
  @IsNumber()
  @Min(0)
  monthlyIncome: number;

  @ApiProperty({ example: 220000, description: 'Preço do veículo (R$)' })
  @IsNumber()
  @Min(0)
  vehiclePrice: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.FINANCING })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 'Sudeste', maxLength: 40 })
  @IsString()
  @MaxLength(40)
  region: string;

  @ApiProperty({ enum: PurchaseChannel, example: PurchaseChannel.DEALERSHIP })
  @IsEnum(PurchaseChannel)
  purchaseChannel: PurchaseChannel;

  @ApiProperty({ example: true, description: 'Houve veículo na troca?' })
  @IsBoolean()
  hasTradeIn: boolean;

  @ApiProperty({ example: 36, description: 'Meses de garantia/pacote contratado', minimum: 0, maximum: 120 })
  @IsInt()
  @Min(0)
  @Max(120)
  warrantyMonths: number;
}
