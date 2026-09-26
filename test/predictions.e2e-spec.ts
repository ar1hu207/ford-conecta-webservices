import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createTestApp,
  expectErrorEnvelope,
  Fixtures,
  resetDatabase,
  seedFixtures,
} from './utils/test-app';

describe('Predictions (e2e)', () => {
  let app: INestApplication;
  let fx: Fixtures;
  let analyst: string;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    fx = await seedFixtures(app);
    analyst = `Bearer ${fx.tokens.analyst}`;
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  /** Perfil de compra de alto risco: financiado, caro para a renda, garantia mínima, online. */
  const highRisk = () => ({
    customerId: fx.customers.other.id,
    age: 26,
    monthlyIncome: 6000,
    vehiclePrice: 250000,
    paymentMethod: 'financing',
    region: 'Nordeste',
    purchaseChannel: 'online',
    hasTradeIn: false,
    warrantyMonths: 12,
  });

  /** Perfil de baixo risco: à vista, garantia longa, maduro, com folga financeira. */
  const lowRisk = () => ({
    customerId: fx.customers.own.id,
    vehicleId: fx.vehicles.own.id,
    age: 52,
    monthlyIncome: 60000,
    vehiclePrice: 200000,
    paymentMethod: 'cash',
    region: 'Sudeste',
    purchaseChannel: 'dealership',
    hasTradeIn: true,
    warrantyMonths: 48,
  });

  let highRiskId: string;

  it('POST gera e persiste a predição: 201 + Location', async () => {
    const res = await http().post('/api/predictions').set('Authorization', analyst).send(highRisk()).expect(201);
    highRiskId = res.body.id;

    expect(res.headers.location).toBe(`/api/predictions/${highRiskId}`);
    expect(res.body).toMatchObject({ segment: 'abandono', modelVersion: 'heuristic-v1' });
    expect(res.body.evasionRisk).toBeGreaterThanOrEqual(0.85);
    expect(res.body.recommendedAction).toEqual(expect.any(String));
  });

  it('perfil de baixo risco sai como "fiel" e com risco baixo', async () => {
    const res = await http().post('/api/predictions').set('Authorization', analyst).send(lowRisk()).expect(201);
    expect(res.body.segment).toBe('fiel');
    expect(res.body.evasionRisk).toBeLessThan(0.2);
  });

  it('GET /api/predictions/:id devolve a predição criada (200)', async () => {
    const res = await http().get(`/api/predictions/${highRiskId}`).set('Authorization', analyst).expect(200);
    expect(res.body.id).toBe(highRiskId);
  });

  it('GET /api/predictions é a lista de risco: maior risco primeiro (200)', async () => {
    const res = await http().get('/api/predictions').set('Authorization', analyst).expect(200);
    const risks = res.body.data.map((p: { evasionRisk: number }) => p.evasionRisk);
    expect(risks).toEqual([...risks].sort((a, b) => b - a));
    expect(res.body.meta.total).toBe(2);
  });

  it('GET /api/customers/:id/predictions traz o histórico do cliente (200)', async () => {
    const res = await http()
      .get(`/api/customers/${fx.customers.other.id}/predictions`)
      .set('Authorization', analyst)
      .expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(highRiskId);
  });

  it('recusa feature de comportamento futuro (anti data leakage) → 400', async () => {
    const res = await http()
      .post('/api/predictions')
      .set('Authorization', analyst)
      .send({ ...highRisk(), revisionsDone: 3 })
      .expect(400);
    expect(res.body.message).toContain('property revisionsDone should not exist');
  });

  it('valida domínio das features (idade < 18, forma de pagamento inválida) → 400', async () => {
    const res = await http()
      .post('/api/predictions')
      .set('Authorization', analyst)
      .send({ ...highRisk(), age: 15, paymentMethod: 'bitcoin' })
      .expect(400);
    expectErrorEnvelope(res.body, 400);
    expect(res.body.message).toHaveLength(2);
  });

  it('predição para cliente inexistente responde 404', async () => {
    await http()
      .post('/api/predictions')
      .set('Authorization', analyst)
      .send({ ...highRisk(), customerId: '00000000-0000-4000-8000-000000000000' })
      .expect(404);
  });

  it('GET de predição inexistente responde 404', async () => {
    await http()
      .get('/api/predictions/00000000-0000-4000-8000-000000000000')
      .set('Authorization', analyst)
      .expect(404);
  });
});
