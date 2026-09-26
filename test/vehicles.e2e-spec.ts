import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  expectErrorEnvelope,
  Fixtures,
  resetDatabase,
  seedFixtures,
} from './utils/test-app';

describe('Vehicles — REST nível 2 e negociação de conteúdo (e2e)', () => {
  let app: INestApplication;
  let fx: Fixtures;
  let admin: string;
  let analyst: string;
  let vehicleId: string;

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
  const newVehicle = () => ({
    vin: '9BFZK54P5J8200001',
    model: 'Maverick',
    modelYear: 2025,
    purchaseDate: '2025-02-01',
    odometer: 1000,
    customerId: fx.customers.own.id,
    dealershipId: fx.dealership.id,
  });

  it('POST /api/vehicles cria o recurso: 201 + header Location', async () => {
    const res = await http()
      .post('/api/vehicles')
      .set('Authorization', analyst)
      .send(newVehicle())
      .expect(201);
    vehicleId = res.body.id;
    expect(res.headers.location).toBe(`/api/vehicles/${vehicleId}`);
    expect(res.body).toMatchObject({ vin: '9BFZK54P5J8200001', customerId: fx.customers.own.id });
  });

  it('POST com VIN já cadastrado responde 409', async () => {
    await http().post('/api/vehicles').set('Authorization', analyst).send(newVehicle()).expect(409);
  });

  it('POST para cliente inexistente responde 404', async () => {
    const res = await http()
      .post('/api/vehicles')
      .set('Authorization', analyst)
      .send({ ...newVehicle(), vin: '9BFZK54P5J8200009', customerId: '00000000-0000-4000-8000-000000000000' })
      .expect(404);
    expect(res.body.message).toBe('Cliente não encontrado');
  });

  describe('GET /api/vehicles/:id — uma URL, duas representações', () => {
    it('sem Accept específico devolve JSON (200)', async () => {
      const res = await http().get(`/api/vehicles/${vehicleId}`).set('Authorization', analyst).expect(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.headers.vary).toMatch(/Accept/);
      expect(res.body).toMatchObject({ id: vehicleId, model: 'Maverick' });
    });

    it('Accept: application/xml devolve a ficha em XML (200)', async () => {
      const res = await http()
        .get(`/api/vehicles/${vehicleId}`)
        .set('Authorization', analyst)
        .set('Accept', 'application/xml')
        .expect(200);
      expect(res.headers['content-type']).toMatch(/application\/xml/);
      expect(res.text).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
      expect(res.text).toContain('<vin>9BFZK54P5J8200001</vin>');
      expect(res.text).toContain('<name>Cliente Dono</name>');
    });

    it('Accept de um formato não suportado responde 406', async () => {
      const res = await http()
        .get(`/api/vehicles/${vehicleId}`)
        .set('Authorization', analyst)
        .set('Accept', 'text/csv')
        .expect(406);
      expectErrorEnvelope(res.body, 406);
    });
  });

  it('GET /api/customers/:id/vehicles lista os veículos do cliente (sub-recurso, 200)', async () => {
    const res = await http()
      .get(`/api/customers/${fx.customers.own.id}/vehicles`)
      .set('Authorization', analyst)
      .expect(200);
    expect(res.body.map((v: { id: string }) => v.id)).toEqual(
      expect.arrayContaining([vehicleId, fx.vehicles.own.id]),
    );
  });

  it('GET /api/customers/:id/vehicles de cliente inexistente responde 404', async () => {
    await http()
      .get('/api/customers/00000000-0000-4000-8000-000000000000/vehicles')
      .set('Authorization', analyst)
      .expect(404);
  });

  it('GET /api/vehicles pagina a coleção (200)', async () => {
    const res = await http().get('/api/vehicles?limit=2').set('Authorization', analyst).expect(200);
    expect(res.body.meta).toMatchObject({ total: 3, limit: 2, totalPages: 2 });
  });

  it('PATCH atualiza só o hodômetro (200)', async () => {
    const res = await http()
      .patch(`/api/vehicles/${vehicleId}`)
      .set('Authorization', analyst)
      .send({ odometer: 5000 })
      .expect(200);
    expect(res.body).toMatchObject({ odometer: 5000, model: 'Maverick' });
  });

  it('PATCH não permite trocar o dono do veículo (400)', async () => {
    const res = await http()
      .patch(`/api/vehicles/${vehicleId}`)
      .set('Authorization', analyst)
      .send({ customerId: fx.customers.other.id })
      .expect(400);
    expect(res.body.message).toContain('property customerId should not exist');
  });

  it('DELETE remove o veículo (204) e o GET seguinte responde 404', async () => {
    await http().delete(`/api/vehicles/${vehicleId}`).set('Authorization', admin).expect(204);
    await http().get(`/api/vehicles/${vehicleId}`).set('Authorization', admin).expect(404);
  });
});
