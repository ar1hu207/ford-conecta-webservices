import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';

describe('AuthService', () => {
  let users: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let jwt: { signAsync: jest.Mock };
  let service: AuthService;

  const stored = (overrides: Partial<User> = {}): User =>
    ({
      id: 'user-1',
      name: 'Ana',
      email: 'ana@example.com',
      passwordHash: bcrypt.hashSync('SenhaCerta1', 4),
      role: UserRole.CUSTOMER,
      customerId: 'cust-1',
      createdAt: new Date('2026-01-01'),
      ...overrides,
    }) as User;

  beforeEach(() => {
    process.env.JWT_SECRET = 'unit-test-secret-with-32-characters!!';
    process.env.JWT_EXPIRES_IN = '3600';
    users = {
      findOne: jest.fn(),
      create: jest.fn((u: User) => u),
      save: jest.fn(async (u: User) => ({ ...u, id: 'new-id', createdAt: new Date() })),
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };
    service = new AuthService(users as unknown as Repository<User>, jwt as unknown as JwtService);
  });

  describe('register', () => {
    it('grava hash bcrypt (nunca a senha) e força o papel customer sem vínculo', async () => {
      users.findOne.mockResolvedValue(null);

      const profile = await service.register({
        name: 'Nova',
        email: 'nova@example.com',
        password: 'SenhaForte123',
      });

      const saved = users.create.mock.calls[0][0] as User;
      expect(saved.role).toBe(UserRole.CUSTOMER);
      expect(saved.passwordHash).not.toBe('SenhaForte123');
      expect(bcrypt.compareSync('SenhaForte123', saved.passwordHash)).toBe(true);
      expect(profile).not.toHaveProperty('passwordHash');
      expect(profile.customerId).toBeNull();
    });

    it('recusa e-mail já cadastrado com 409', async () => {
      users.findOne.mockResolvedValue(stored());
      await expect(
        service.register({ name: 'X', email: 'ana@example.com', password: 'SenhaForte123' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('assina o token só com sub, role e cid e devolve expiresIn em segundos', async () => {
      users.findOne.mockResolvedValue(stored());

      const res = await service.login({ email: 'ana@example.com', password: 'SenhaCerta1' });

      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        role: UserRole.CUSTOMER,
        cid: 'cust-1',
      });
      expect(res).toMatchObject({ accessToken: 'signed.jwt.token', tokenType: 'Bearer', expiresIn: 3600 });
      expect(res.user).not.toHaveProperty('passwordHash');
    });

    it('senha errada → 401', async () => {
      users.findOne.mockResolvedValue(stored());
      await expect(
        service.login({ email: 'ana@example.com', password: 'errada' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwt.signAsync).not.toHaveBeenCalled();
    });

    it('e-mail inexistente → 401 com a mesma mensagem da senha errada', async () => {
      users.findOne.mockResolvedValue(null);
      await expect(
        service.login({ email: 'x@example.com', password: 'qualquer' }),
      ).rejects.toThrow('Credenciais inválidas');
    });
  });
});
