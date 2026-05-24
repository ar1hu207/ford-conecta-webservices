import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

/**
 * Cliente: dono do veículo. Dado pessoal sensível (tratado pela camada de Cybersecurity).
 */
@Entity('customers')
export class Customer extends BaseEntity {
  @Column({ length: 140 })
  name: string;

  /** CPF (somente dígitos). Identificador único do cliente. */
  @Index({ unique: true })
  @Column({ length: 11 })
  document: string;

  @Column({ length: 160 })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 80 })
  city: string;

  @Column({ length: 2 })
  state: string;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.customer)
  vehicles: Vehicle[];
}
