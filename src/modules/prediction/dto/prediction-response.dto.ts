import { ApiProperty } from '@nestjs/swagger';
import { CustomerSegment } from '../enums/customer-segment.enum';

/** Predição devolvida pela API, já com a ação de retenção recomendada para o perfil. */
export class PredictionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  customerId: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  vehicleId: string | null;

  @ApiProperty({ enum: CustomerSegment, example: CustomerSegment.ABANDONO })
  segment: CustomerSegment;

  @ApiProperty({ example: 0.9, description: 'Probabilidade estimada de evasão (0..1)' })
  evasionRisk: number;

  @ApiProperty({ example: 0.41, description: 'Confiança na classificação (0..1)' })
  confidence: number;

  @ApiProperty({ example: 'Oferta agressiva na 1ª revisão (preço-âncora) + contato proativo...' })
  recommendedAction: string;

  @ApiProperty({ example: 'heuristic-v1' })
  modelVersion: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Features do momento da compra usadas na predição',
  })
  features: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;
}
