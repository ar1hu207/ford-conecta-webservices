import { DataSourceOptions } from 'typeorm';

/**
 * Fonte única de configuração de conexão ao banco.
 * Reutilizada tanto pelo NestJS (TypeOrmModule) quanto pela CLI de migrations
 * (src/config/data-source.ts), garantindo que app e migrations usem a mesma config.
 */
export function buildDataSourceOptions(
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: parseInt(env.DB_PORT ?? '5432', 10),
    username: env.DB_USER ?? 'ford',
    password: env.DB_PASSWORD ?? 'ford_secret',
    database: env.DB_NAME ?? 'ford_conecta',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    // Em vez de synchronize, usamos migrations versionadas (controle de migrações).
    synchronize: false,
    logging: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  };
}
