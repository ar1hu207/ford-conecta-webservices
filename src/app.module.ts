import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './config/database.config';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DealershipsModule } from './modules/dealerships/dealerships.module';
import { PredictionModule } from './modules/prediction/prediction.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';

@Module({
  imports: [
    // Carrega o .env e disponibiliza as variáveis globalmente.
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting / throttling global (Cybersecurity: proteção de APIs).
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
      },
    ]),

    // Conexão ao PostgreSQL (camada de dados).
    TypeOrmModule.forRootAsync({
      useFactory: () => buildDataSourceOptions(),
    }),

    HealthModule,
    // Módulos de domínio — serviços SOA independentes e reutilizáveis.
    AuthModule,
    CustomersModule,
    DealershipsModule,
    VehiclesModule,
    PredictionModule,
  ],
  providers: [
    // Aplica o rate limiting a todas as rotas.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
