import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

/**
 * Concessionária da rede oficial Ford.
 */
@Entity('dealerships')
export class Dealership extends BaseEntity {
  @Column({ length: 140 })
  name: string;

  @Column({ length: 80 })
  city: string;

  @Column({ length: 40 })
  region: string;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.dealership)
  vehicles: Vehicle[];
}
