import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { UserRole } from '../enums/user-role.enum';

/**
 * Usuário do sistema (Cockpit ou App). Autenticação via e-mail + senha (hash bcrypt).
 */
@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 120 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 160 })
  email: string;

  /** Hash bcrypt da senha. Nunca é retornado nas respostas da API. */
  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ANALYST })
  role: UserRole;

  /**
   * Cliente vinculado (somente papel CUSTOMER). É o que restringe o dono do
   * veículo aos próprios dados (autorização por propriedade do recurso).
   */
  @Index({ unique: true })
  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string | null;

  @OneToOne(() => Customer, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer | null;
}
