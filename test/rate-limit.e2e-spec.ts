import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, expectErrorEnvelope, resetDatabase } from './utils/test-app';

describe('Rate limit no login (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    // Sem seedFixtures: os logins dele contariam no limite. O limite é lido a cada requisição.
    process.env.LOGIN_THROTTLE_LIMIT = '3';
  });

  afterAll(async () => {
    process.env.LOGIN_THROTTLE_LIMIT = '1000';
    await app.close();
  });

  it('bloqueia força bruta: depois de 3 tentativas a 4ª responde 429', async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'vitima@example.com', password: 'chute-errado' });

    for (let i = 0; i < 3; i++) {
      await attempt().expect(401);
    }
    const res = await attempt().expect(429);
    expectErrorEnvelope(res.body, 429);
    expect(res.headers['retry-after']).toBeDefined();
  });
});
