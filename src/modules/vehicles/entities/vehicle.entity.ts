import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Dealership } from '../../dealerships/entities/dealership.entity';

/**
 * Veículo Ford de um cliente. O VIN é o identificador-chave do indicador VIN Share.
 */
@Entity('vehicles')
export class Vehicle extends BaseEntity {
  /** Vehicle Identification Number — 17 caracteres. */
  @Index({ unique: true })
  @Column({ length: 17 })
  vin: string;

  @Column({ length: 60 })
  model: string;

  @Column({ name: 'model_year', type: 'int' })
  modelYear: number;

  @Column({ name: 'purchase_date', type: 'date' })
  purchaseDate: string;

  /** Hodômetro atual (km) — dado de veículo conectado (IoT). NÃO é usado na predição. */
  @Column({ type: 'int', default: 0 })
  odometer: number;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.vehicles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'dealership_id', nullable: true })
  dealershipId: string;

  @ManyToOne(() => Dealership, (dealership) => dealership.vehicles, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'dealership_id' })
  dealership: Dealership;
}
