import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { CustomerSegment } from '../enums/customer-segment.enum';

/**
 * Resultado de uma predição: o perfil estimado do cliente e o risco de evasão,
 * calculados a partir de informações disponíveis no momento da compra.
 */
@Entity('predictions')
export class Prediction extends BaseEntity {
  @Index()
  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'vehicle_id', nullable: true })
  vehicleId: string;

  @ManyToOne(() => Vehicle, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ type: 'enum', enum: CustomerSegment })
  segment: CustomerSegment;

  /** Probabilidade estimada de evasão da rede oficial (0..1). */
  @Column({ name: 'evasion_risk', type: 'double precision' })
  evasionRisk: number;

  /** Confiança do modelo na classificação (0..1). */
  @Column({ type: 'double precision' })
  confidence: number;

  /** Snapshot das features (momento da compra) usadas na predição. */
  @Column({ type: 'jsonb' })
  features: Record<string, unknown>;

  /** Versão do modelo/estratégia que gerou a predição (ex.: heuristic-v1). */
  @Column({ name: 'model_version', length: 40 })
  modelVersion: string;
}
