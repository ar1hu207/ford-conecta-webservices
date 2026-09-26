import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, Fixtures, resetDatabase, seedFixtures } from './utils/test-app';

describe('Dealerships — CRUD (e2e)', () => {
  let app: INestApplication;
  let fx: Fixtures;
  let admin: string;
  let dealershipId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    fx = await seedFixtures(app);
    admin = `Bearer ${fx.tokens.admin}`;
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('POST cria a concessionária: 201 + Location', async () => {
    const res = await http()
      .post('/api/dealerships')
      .set('Authorization', admin)
      .send({ name: 'Ford Centro-Oeste', city: 'Goiânia', region: 'Centro-Oeste' })
      .expect(201);
    dealershipId = res.body.id;
    expect(res.headers.location).toBe(`/api/dealerships/${dealershipId}`);
  });

  it('POST sem campos obrigatórios responde 400', async () => {
    await http().post('/api/dealerships').set('Authorization', admin).send({ name: 'X' }).expect(400);
  });

  it('GET lista em ordem alfabética (200), para qualquer papel autenticado', async () => {
    const res = await http()
      .get('/api/dealerships')
      .set('Authorization', `Bearer ${fx.tokens.customer}`)
      .expect(200);
    expect(res.body.map((d: { name: string }) => d.name)).toEqual(['Ford Centro-Oeste', 'Ford Teste']);
  });

  it('PATCH atualiza parcialmente (200)', async () => {
    const res = await http()
      .patch(`/api/dealerships/${dealershipId}`)
      .set('Authorization', admin)
      .send({ city: 'Brasília' })
      .expect(200);
    expect(res.body).toMatchObject({ city: 'Brasília', region: 'Centro-Oeste' });
  });

  it('DELETE da concessionária mantém os veículos, só sem concessionária (204)', async () => {
    await http().delete(`/api/dealerships/${fx.dealership.id}`).set('Authorization', admin).expect(204);
    await http().get(`/api/dealerships/${fx.dealership.id}`).set('Authorization', admin).expect(404);

    const vehicle = await http()
      .get(`/api/vehicles/${fx.vehicles.own.id}`)
      .set('Authorization', admin)
      .expect(200);
    expect(vehicle.body.dealershipId).toBeNull();
  });
});
