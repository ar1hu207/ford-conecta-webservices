import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
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
}
