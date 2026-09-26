import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  expectErrorEnvelope,
  Fixtures,
  PASSWORD,
  resetDatabase,
  seedFixtures,
} from './utils/test-app';

describe('Autenticação (e2e)', () => {
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

  describe('endpoints públicos', () => {
    it('GET /health responde 200 sem token', async () => {
      const res = await request(app.getHttpServer()).get('/health').expect(200);
      expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
    });

    it('POST /api/auth/register cria usuário com papel customer e sem hash de senha (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Nova Cliente', email: 'nova@example.com', password: 'SenhaForte123' })
        .expect(201);

      expect(res.body).toMatchObject({
        email: 'nova@example.com',
        role: 'customer',
        customerId: null,
      });
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('password');
    });

    it('POST /api/auth/register com e-mail já usado responde 409', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Duplicado', email: fx.users.admin.email, password: 'SenhaForte123' })
        .expect(409);
      expectErrorEnvelope(res.body, 409);
    });

    it('POST /api/auth/register com dados inválidos responde 400 com a lista de erros', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: '', email: 'nao-e-email', password: '123' })
        .expect(400);
      expectErrorEnvelope(res.body, 400);
      expect(Array.isArray(res.body.message)).toBe(true);
      expect(res.body.message.length).toBeGreaterThanOrEqual(3);
    });

    it('POST /api/auth/register não aceita escolher o papel (escalada de privilégio) → 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Espertinho', email: 'hacker@example.com', password: 'SenhaForte123', role: 'admin' })
        .expect(400);
      expect(res.body.message).toContain('property role should not exist');
    });
  });

  describe('login', () => {
    it('credenciais válidas emitem um Bearer token (200)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: fx.users.analyst.email, password: PASSWORD })
        .expect(200);

      expect(res.body).toMatchObject({
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: { email: fx.users.analyst.email, role: 'analyst' },
      });
      expect(res.body.accessToken.split('.')).toHaveLength(3);
    });

    it('senha errada responde 401 com mensagem genérica', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: fx.users.analyst.email, password: 'errada123' })
        .expect(401);
      expectErrorEnvelope(res.body, 401);
      expect(res.body.message).toBe('Credenciais inválidas');
    });

    it('e-mail inexistente responde a MESMA mensagem (não revela quem tem conta)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'ninguem@example.com', password: 'qualquer123' })
        .expect(401);
      expect(res.body.message).toBe('Credenciais inválidas');
    });
  });

  describe('endpoints protegidos', () => {
    it('GET /api/auth/me com token devolve o perfil do usuário (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${fx.tokens.customer}`)
        .expect(200);
      expect(res.body).toMatchObject({
        id: fx.users.customer.id,
        role: 'customer',
        customerId: fx.customers.own.id,
      });
    });

    it('GET /api/auth/me sem token responde 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/auth/me').expect(401);
      expectErrorEnvelope(res.body, 401);
    });

    it.each([
      ['/api/customers'],
      ['/api/vehicles'],
      ['/api/dealerships'],
      ['/api/predictions'],
      ['/api/users'],
    ])('GET %s sem token responde 401', async (path) => {
      await request(app.getHttpServer()).get(path).expect(401);
    });
  });
});
