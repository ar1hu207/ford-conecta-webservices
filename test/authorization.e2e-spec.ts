import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  expectErrorEnvelope,
  Fixtures,
  resetDatabase,
  seedFixtures,
} from './utils/test-app';

type Role = 'admin' | 'analyst' | 'customer' | 'anonymous';
type Method = 'get' | 'post' | 'patch' | 'delete';

describe('Autorização por perfil (e2e)', () => {
  let app: INestApplication;
  let fx: Fixtures;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    fx = await seedFixtures(app);
  });

  afterAll(async () => {
    await app.close();
  });

  /** Troca os marcadores :own, :other, :ownVehicle e :otherVehicle pelos ids da massa de dados. */
  const resolve = (path: string) =>
    path
      .replace(':ownVehicle', fx.vehicles.own.id)
      .replace(':otherVehicle', fx.vehicles.other.id)
      .replace(':own', fx.customers.own.id)
      .replace(':other', fx.customers.other.id)
      .replace(':dealership', fx.dealership.id);

  const call = (role: Role, method: Method, path: string) => {
    const req = request(app.getHttpServer())[method](resolve(path));
    return role === 'anonymous' ? req : req.set('Authorization', `Bearer ${fx.tokens[role]}`);
  };

  // [papel, método, rota, status esperado]
  const matrix: [Role, Method, string, number][] = [
    // Sem token: tudo que é protegido responde 401.
    ['anonymous', 'get', '/api/customers/:own', 401],
    ['anonymous', 'post', '/api/predictions', 401],

    // customer (dono do veículo): só os próprios dados, sem visão de gestão.
    ['customer', 'get', '/api/customers/me', 200],
    ['customer', 'get', '/api/customers/:own', 200],
    ['customer', 'get', '/api/customers/:other', 403],
    ['customer', 'get', '/api/customers/:own/vehicles', 200],
    ['customer', 'get', '/api/customers/:other/vehicles', 403],
    ['customer', 'get', '/api/vehicles/:ownVehicle', 200],
    ['customer', 'get', '/api/vehicles/:otherVehicle', 403],
    ['customer', 'get', '/api/dealerships', 200],
    ['customer', 'get', '/api/customers', 403],
    ['customer', 'get', '/api/vehicles', 403],
    ['customer', 'post', '/api/customers', 403],
    ['customer', 'patch', '/api/customers/:own', 403],
    ['customer', 'get', '/api/predictions', 403],
    ['customer', 'get', '/api/customers/:own/predictions', 403],
    ['customer', 'get', '/api/users', 403],

    // analyst (pós-venda): lê e edita a carteira, gera predições; não remove nem administra.
    ['analyst', 'get', '/api/customers', 200],
    ['analyst', 'get', '/api/customers/:other', 200],
    ['analyst', 'get', '/api/vehicles/:otherVehicle', 200],
    ['analyst', 'get', '/api/predictions', 200],
    ['analyst', 'get', '/api/customers/:other/predictions', 200],
    ['analyst', 'get', '/api/customers/me', 403],
    ['analyst', 'delete', '/api/customers/:other', 403],
    ['analyst', 'delete', '/api/vehicles/:otherVehicle', 403],
    ['analyst', 'post', '/api/dealerships', 403],
    ['analyst', 'delete', '/api/dealerships/:dealership', 403],
    ['analyst', 'get', '/api/users', 403],

    // admin: acesso total.
    ['admin', 'get', '/api/users', 200],
    ['admin', 'get', '/api/customers', 200],
    ['admin', 'get', '/api/customers/:other/vehicles', 200],
    ['admin', 'get', '/api/predictions', 200],
  ];

  it.each(matrix)('%s %s %s → %i', async (role, method, path, status) => {
    const res = await call(role, method, path).expect(status);
    if (status >= 400) {
      expectErrorEnvelope(res.body, status);
    }
  });

  it('customer não vê o cliente de outro nem sabendo o id: a resposta é 403, sem dados', async () => {
    const res = await call('customer', 'get', '/api/customers/:other').expect(403);
    expect(res.body.message).toBe('Você só pode acessar os seus próprios dados');
    expect(JSON.stringify(res.body)).not.toContain(fx.customers.other.document);
  });

  describe('vínculo usuário ↔ cliente (admin)', () => {
    const patchUser = (id: string, body: object, token = fx.tokens.admin) =>
      request(app.getHttpServer())
        .patch(`/api/users/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(body);

    it('customer sem vínculo recebe 404 em /customers/me', async () => {
      await request(app.getHttpServer())
        .get('/api/customers/me')
        .set('Authorization', `Bearer ${fx.tokens.orphan}`)
        .expect(404);
    });

    it('não vincula um cliente que já pertence a outro usuário (409)', async () => {
      const res = await patchUser(fx.users.orphan.id, { customerId: fx.customers.own.id }).expect(409);
      expectErrorEnvelope(res.body, 409);
    });

    it('não vincula cliente a um usuário que não é customer (400)', async () => {
      await patchUser(fx.users.analyst.id, { customerId: fx.customers.other.id }).expect(400);
    });

    it('não vincula cliente inexistente (404)', async () => {
      await patchUser(fx.users.orphan.id, {
        customerId: '00000000-0000-4000-8000-000000000000',
      }).expect(404);
    });

    it('analyst não pode vincular usuários (403)', async () => {
      await patchUser(
        fx.users.orphan.id,
        { customerId: fx.customers.other.id },
        fx.tokens.analyst,
      ).expect(403);
    });

    it('admin vincula e o acesso passa a valer com o mesmo token do usuário (200)', async () => {
      const res = await patchUser(fx.users.orphan.id, { customerId: fx.customers.other.id }).expect(200);
      expect(res.body.customerId).toBe(fx.customers.other.id);

      const me = await request(app.getHttpServer())
        .get('/api/customers/me')
        .set('Authorization', `Bearer ${fx.tokens.orphan}`)
        .expect(200);
      expect(me.body.id).toBe(fx.customers.other.id);
    });

    it('admin desvincula com customerId null (200)', async () => {
      const res = await patchUser(fx.users.orphan.id, { customerId: null }).expect(200);
      expect(res.body.customerId).toBeNull();
    });
  });
});
