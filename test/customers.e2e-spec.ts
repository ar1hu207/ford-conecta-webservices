import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  expectErrorEnvelope,
  Fixtures,
  resetDatabase,
  seedFixtures,
} from './utils/test-app';

describe('Customers — REST nível 2 (e2e)', () => {
  let app: INestApplication;
  let fx: Fixtures;
  let admin: string;
  let analyst: string;

  const newCustomer = {
    name: 'Paula Lima',
    document: '55555555555',
    email: 'paula@example.com',
    phone: '+5511990005555',
    city: 'Santos',
    state: 'SP',
  };

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    fx = await seedFixtures(app);
    admin = `Bearer ${fx.tokens.admin}`;
    analyst = `Bearer ${fx.tokens.analyst}`;
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  let createdId: string;

  it('POST /api/customers cria o recurso: 201 + header Location', async () => {
    const res = await http()
      .post('/api/customers')
      .set('Authorization', analyst)
      .send(newCustomer)
      .expect(201);

    createdId = res.body.id;
    expect(res.body).toMatchObject(newCustomer);
    expect(res.headers.location).toBe(`/api/customers/${createdId}`);
  });

  it('GET na URL do Location devolve o recurso criado (200)', async () => {
    const res = await http()
      .get(`/api/customers/${createdId}`)
      .set('Authorization', analyst)
      .expect(200);
    expect(res.body).toMatchObject({ id: createdId, document: newCustomer.document });
    expect(res.body.vehicles).toEqual([]);
  });

  it('POST com CPF já cadastrado responde 409', async () => {
    const res = await http()
      .post('/api/customers')
      .set('Authorization', analyst)
      .send(newCustomer)
      .expect(409);
    expectErrorEnvelope(res.body, 409);
    expect(res.body.message).toBe('Já existe um cliente com este CPF');
  });

  it('POST com dados inválidos responde 400 e lista cada problema', async () => {
    const res = await http()
      .post('/api/customers')
      .set('Authorization', analyst)
      .send({ ...newCustomer, document: '123', email: 'x', state: 'SPX' })
      .expect(400);
    expectErrorEnvelope(res.body, 400);
    expect(res.body.message).toEqual(
      expect.arrayContaining([
        'document deve conter 11 dígitos numéricos',
        'email must be an email',
      ]),
    );
  });

  it('POST com campo não previsto no contrato responde 400', async () => {
    const res = await http()
      .post('/api/customers')
      .set('Authorization', analyst)
      .send({ ...newCustomer, document: '66666666666', isVip: true })
      .expect(400);
    expect(res.body.message).toContain('property isVip should not exist');
  });

  it('GET /api/customers pagina a coleção (200)', async () => {
    const res = await http()
      .get('/api/customers?page=1&limit=2')
      .set('Authorization', analyst)
      .expect(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toEqual({ total: 3, page: 1, limit: 2, totalPages: 2 });
  });

  it('GET /api/customers com limit acima de 100 responde 400', async () => {
    await http().get('/api/customers?limit=500').set('Authorization', analyst).expect(400);
  });

  it('GET com id que não é UUID responde 400', async () => {
    const res = await http()
      .get('/api/customers/nao-e-uuid')
      .set('Authorization', analyst)
      .expect(400);
    expectErrorEnvelope(res.body, 400);
  });

  it('GET de id inexistente responde 404 no envelope padrão', async () => {
    const missing = '00000000-0000-4000-8000-000000000000';
    const res = await http()
      .get(`/api/customers/${missing}`)
      .set('Authorization', analyst)
      .expect(404);
    expectErrorEnvelope(res.body, 404);
    expect(res.body).toMatchObject({
      message: 'Cliente não encontrado',
      path: `/api/customers/${missing}`,
    });
  });

  it('PATCH atualiza só os campos enviados (200)', async () => {
    const res = await http()
      .patch(`/api/customers/${createdId}`)
      .set('Authorization', analyst)
      .send({ city: 'Guarujá' })
      .expect(200);
    expect(res.body).toMatchObject({ city: 'Guarujá', name: newCustomer.name });
  });

  it('PATCH para um CPF de outro cliente responde 409', async () => {
    await http()
      .patch(`/api/customers/${createdId}`)
      .set('Authorization', analyst)
      .send({ document: fx.customers.own.document })
      .expect(409);
  });

  it('PATCH de id inexistente responde 404', async () => {
    await http()
      .patch('/api/customers/00000000-0000-4000-8000-000000000000')
      .set('Authorization', analyst)
      .send({ city: 'X' })
      .expect(404);
  });

  it('DELETE remove o recurso: 204 sem corpo', async () => {
    const res = await http()
      .delete(`/api/customers/${createdId}`)
      .set('Authorization', admin)
      .expect(204);
    expect(res.text).toBe('');
  });

  it('depois do DELETE, GET e DELETE do mesmo id respondem 404', async () => {
    await http().get(`/api/customers/${createdId}`).set('Authorization', admin).expect(404);
    await http().delete(`/api/customers/${createdId}`).set('Authorization', admin).expect(404);
  });

  it('rota inexistente responde 404 no mesmo envelope de erro', async () => {
    const res = await http().get('/api/nao-existe').set('Authorization', admin).expect(404);
    expectErrorEnvelope(res.body, 404);
  });
});
