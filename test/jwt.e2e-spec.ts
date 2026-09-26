import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/auth/entities/user.entity';
import { UserRole } from '../src/modules/auth/enums/user-role.enum';
import {
  createTestApp,
  expectErrorEnvelope,
  Fixtures,
  login,
  resetDatabase,
  seedFixtures,
} from './utils/test-app';

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const decode = (segment: string) => JSON.parse(Buffer.from(segment, 'base64url').toString());

describe('JWT (e2e)', () => {
  let app: INestApplication;
  let fx: Fixtures;
  const secret = process.env.JWT_SECRET as string;
  const issuer = process.env.JWT_ISSUER as string;
  const audience = process.env.JWT_AUDIENCE as string;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    fx = await seedFixtures(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const getMe = (token: string) =>
    request(app.getHttpServer()).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

  describe('geração', () => {
    it('emite HS256 com sub, role, cid, iss, aud e expiração de 1h, sem dado sensível', () => {
      const [header, payload] = fx.tokens.customer.split('.').map((s, i) => (i < 2 ? decode(s) : s));

      expect(header).toMatchObject({ alg: 'HS256', typ: 'JWT' });
      expect(payload).toMatchObject({
        sub: fx.users.customer.id,
        role: 'customer',
        cid: fx.customers.own.id,
        iss: issuer,
        aud: audience,
      });
      expect(payload.exp - payload.iat).toBe(3600);
      expect(payload).not.toHaveProperty('passwordHash');
      expect(payload).not.toHaveProperty('email');
    });
  });

  describe('validação', () => {
    it('token válido é aceito (200)', async () => {
      await getMe(fx.tokens.admin).expect(200);
    });

    it('token expirado é rejeitado (401)', async () => {
      const now = Math.floor(Date.now() / 1000);
      const expired = await new JwtService({ secret }).signAsync(
        { sub: fx.users.admin.id, role: 'admin', iat: now - 7200, exp: now - 3600 },
        { issuer, audience },
      );
      const res = await getMe(expired).expect(401);
      expectErrorEnvelope(res.body, 401);
    });

    it('payload adulterado (customer → admin) invalida a assinatura (401)', async () => {
      const [header, payload, signature] = fx.tokens.customer.split('.');
      const forged = base64url({ ...decode(payload), role: 'admin' });
      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${header}.${forged}.${signature}`)
        .expect(401);
    });

    it('token assinado com outro segredo é rejeitado (401)', async () => {
      const token = await new JwtService({
        secret: 'um-segredo-qualquer-que-nao-e-o-da-api',
      }).signAsync({ sub: fx.users.admin.id, role: 'admin' }, { issuer, audience });
      await getMe(token).expect(401);
    });

    it('token de outro emissor (iss) é rejeitado (401)', async () => {
      const token = await new JwtService({ secret }).signAsync(
        { sub: fx.users.admin.id, role: 'admin' },
        { issuer: 'outra-api', audience },
      );
      await getMe(token).expect(401);
    });

    it('token para outra audiência (aud) é rejeitado (401)', async () => {
      const token = await new JwtService({ secret }).signAsync(
        { sub: fx.users.admin.id, role: 'admin' },
        { issuer, audience: 'outro-cliente' },
      );
      await getMe(token).expect(401);
    });

    it('token sem assinatura (alg: none) é rejeitado (401)', async () => {
      const now = Math.floor(Date.now() / 1000);
      const unsigned = `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url({
        sub: fx.users.admin.id,
        role: 'admin',
        iss: issuer,
        aud: audience,
        iat: now,
        exp: now + 3600,
      })}.`;
      await getMe(unsigned).expect(401);
    });

    it.each([
      ['token malformado', 'Bearer abc.def'],
      ['esquema errado', `Basic ${Buffer.from('admin:senha').toString('base64')}`],
      ['Bearer vazio', 'Bearer '],
    ])('%s é rejeitado (401)', async (_, header) => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', header)
        .expect(401);
    });
  });

  describe('uso das informações do token', () => {
    it('token de usuário removido deixa de valer na hora (401)', async () => {
      const users = app.get(DataSource).getRepository(User);
      const temp = await users.save(
        users.create({
          name: 'Temporario',
          email: 'temp@test.com',
          passwordHash: fx.users.admin.passwordHash,
          role: UserRole.ANALYST,
        }),
      );
      const token = await login(app, temp.email);
      await getMe(token).expect(200);

      await users.delete(temp.id);
      await getMe(token).expect(401);
    });

    it('rebaixamento de papel vale na hora, mesmo com token antigo (200 → 403)', async () => {
      const users = app.get(DataSource).getRepository(User);
      const temp = await users.save(
        users.create({
          name: 'Analista Temporario',
          email: 'temp-analyst@test.com',
          passwordHash: fx.users.admin.passwordHash,
          role: UserRole.ANALYST,
        }),
      );
      const oldToken = await login(app, temp.email);
      const listCustomers = () =>
        request(app.getHttpServer())
          .get('/api/customers')
          .set('Authorization', `Bearer ${oldToken}`);

      await listCustomers().expect(200);

      await request(app.getHttpServer())
        .patch(`/api/users/${temp.id}`)
        .set('Authorization', `Bearer ${fx.tokens.admin}`)
        .send({ role: 'customer' })
        .expect(200);

      await listCustomers().expect(403);
    });
  });
});
