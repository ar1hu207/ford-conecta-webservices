import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';
import { AuthenticatedUser } from '../strategies/jwt.strategy';

/**
 * Autorização por propriedade do recurso (evita BOLA, OWASP API1):
 * admin e analyst acessam qualquer cliente; o papel customer só acessa
 * o cliente vinculado ao próprio usuário.
 */
export function assertCustomerAccess(
  user: AuthenticatedUser,
  customerId: string,
): void {
  if (user.role === UserRole.CUSTOMER && user.customerId !== customerId) {
    throw new ForbiddenException('Você só pode acessar os seus próprios dados');
  }
}
