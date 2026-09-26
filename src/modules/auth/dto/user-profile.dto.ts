import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';

/** Representação pública do usuário: nunca inclui o hash da senha. */
export class UserProfileDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Maria Souza' })
  name: string;

  @ApiProperty({ example: 'maria@example.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  role: UserRole;

  @ApiProperty({
    format: 'uuid',
    nullable: true,
    description: 'Cliente vinculado (somente papel customer)',
  })
  customerId: string | null;

  @ApiProperty()
  createdAt: Date;

  static from(user: User): UserProfileDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      customerId: user.customerId ?? null,
      createdAt: user.createdAt,
    };
  }
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT assinado (HS256)' })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: 'Bearer';

  @ApiProperty({ example: 3600, description: 'Validade do token, em segundos' })
  expiresIn: number;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}
