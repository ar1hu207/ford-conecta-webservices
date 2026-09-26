import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomersService } from '../customers/customers.service';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { UsersService } from './users.service';

describe('UsersService.update (vínculo usuário ↔ cliente)', () => {
  let users: { findOne: jest.Mock; save: jest.Mock };
  let customers: { findOne: jest.Mock };
  let service: UsersService;

  const user = (overrides: Partial<User> = {}) =>
    ({
      id: 'u1',
      name: 'U',
      email: 'u@example.com',
      role: UserRole.CUSTOMER,
      customerId: null,
      createdAt: new Date(),
      ...overrides,
    }) as User;

  beforeEach(() => {
    users = { findOne: jest.fn(), save: jest.fn(async (u: User) => u) };
    customers = { findOne: jest.fn().mockResolvedValue({ id: 'c1' }) };
    service = new UsersService(
      users as unknown as Repository<User>,
      customers as unknown as CustomersService,
    );
  });

  /** Primeira busca = usuário alvo; segunda = dono atual do cliente (se houver). */
  const given = (target: User, currentOwner: User | null = null) =>
    users.findOne.mockResolvedValueOnce(target).mockResolvedValueOnce(currentOwner);

  it('vincula um customer a um cliente livre', async () => {
    given(user());
    const res = await service.update('u1', { customerId: 'c1' });
    expect(res.customerId).toBe('c1');
  });

  it('recusa cliente já vinculado a outro usuário (409)', async () => {
    given(user(), user({ id: 'u2', customerId: 'c1' }));
    await expect(service.update('u1', { customerId: 'c1' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('recusa vincular cliente a analyst/admin (400)', async () => {
    given(user({ role: UserRole.ANALYST }));
    await expect(service.update('u1', { customerId: 'c1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('promover a analyst desfaz o vínculo com cliente', async () => {
    given(user({ customerId: 'c1' }));
    const res = await service.update('u1', { role: UserRole.ANALYST });
    expect(res).toMatchObject({ role: UserRole.ANALYST, customerId: null });
  });

  it('usuário inexistente → 404', async () => {
    users.findOne.mockResolvedValueOnce(null);
    await expect(service.update('nao-existe', { role: UserRole.ADMIN })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
