import { config } from 'dotenv';
import { Client } from 'pg';

/**
 * Roda uma vez antes da suíte e2e: garante que o banco de teste exista.
 * O schema é recriado por cada arquivo de teste (ver resetDatabase).
 */
export default async function globalSetup(): Promise<void> {
  config();
  const devDb = process.env.DB_NAME ?? 'ford_conecta';
  const testDb = process.env.DB_NAME_TEST ?? 'ford_conecta_test';

  // Proteções: o schema do banco de teste é apagado a cada arquivo.
  if (!/^[a-z0-9_]+$/.test(testDb)) {
    throw new Error(`DB_NAME_TEST inválido: ${testDb}`);
  }
  if (testDb === devDb) {
    throw new Error('DB_NAME_TEST não pode ser o mesmo banco de desenvolvimento.');
  }

  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER ?? 'ford',
    password: process.env.DB_PASSWORD ?? 'ford_secret',
    database: 'postgres',
  });
  await client.connect();
  const found = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [testDb]);
  if (found.rowCount === 0) {
    await client.query(`CREATE DATABASE "${testDb}"`);
  }
  await client.end();
}
