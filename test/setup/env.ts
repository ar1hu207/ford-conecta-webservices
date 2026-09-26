import { config } from 'dotenv';

/**
 * Ambiente dos testes. Roda antes de cada arquivo de teste, antes de qualquer
 * import da aplicação. Credenciais do Postgres vêm do .env (ou do CI).
 */
config();

process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.DB_NAME_TEST ?? 'ford_conecta_test';

process.env.JWT_SECRET = 'e2e-test-secret-with-more-than-32-chars';
process.env.JWT_EXPIRES_IN = '3600';
process.env.JWT_ISSUER = 'ford-conecta-api';
process.env.JWT_AUDIENCE = 'ford-conecta-clients';

// Limites altos para a suíte; rate-limit.e2e-spec.ts baixa o do login para testar o 429.
process.env.THROTTLE_LIMIT = '10000';
process.env.LOGIN_THROTTLE_LIMIT = '1000';
