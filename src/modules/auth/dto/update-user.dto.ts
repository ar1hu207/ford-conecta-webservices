import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

/** Alteração administrativa de um usuário: papel e/ou cliente vinculado. */
export class UpdateUserDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Cliente a vincular (papel customer). Envie null para desvincular.',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string | null;
}
