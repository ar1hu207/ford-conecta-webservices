import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';
import { AuthenticatedUser } from '../strategies/jwt.strategy';
import { assertCustomerAccess } from './customer-access.policy';

describe('assertCustomerAccess', () => {
  const user = (role: UserRole, customerId: string | null = null): AuthenticatedUser => ({
    userId: 'u1',
    email: 'u@example.com',
    role,
    customerId,
  });

  it.each([UserRole.ADMIN, UserRole.ANALYST])('%s acessa qualquer cliente', (role) => {
    expect(() => assertCustomerAccess(user(role), 'cliente-x')).not.toThrow();
  });

  it('customer acessa o próprio cliente', () => {
    expect(() => assertCustomerAccess(user(UserRole.CUSTOMER, 'c1'), 'c1')).not.toThrow();
  });

  it('customer não acessa cliente de outra pessoa', () => {
    expect(() => assertCustomerAccess(user(UserRole.CUSTOMER, 'c1'), 'c2')).toThrow(
      ForbiddenException,
    );
  });

  it('customer sem vínculo não acessa nenhum cliente', () => {
    expect(() => assertCustomerAccess(user(UserRole.CUSTOMER, null), 'c1')).toThrow(
      ForbiddenException,
    );
  });
});
