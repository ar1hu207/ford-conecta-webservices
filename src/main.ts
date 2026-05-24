import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Cabeçalhos de segurança HTTP (Cybersecurity).
  app.use(helmet());

  // CORS restrito a domínios autorizados (Cybersecurity: proteção de APIs).
  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins.length ? origins : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Todas as rotas de negócio sob /api; /health fica na raiz.
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Validação e sanitização global de entradas (Cybersecurity + boas práticas).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove propriedades não declaradas no DTO
      forbidNonWhitelisted: true, // rejeita payloads com campos extras
      transform: true, // converte tipos conforme o DTO
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Formato único de resposta de erro, sem vazar stack trace.
  app.useGlobalFilters(new AllExceptionsFilter());

  // Documentação Swagger (contrato dos endpoints) em /docs.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ford Conecta — API (Web Services)')
    .setDescription(
      'Camada de Serviços REST da plataforma Ford Conecta — FIAP Ford 2026, Desafio 02. ' +
        'Serviços SOA: Autenticação, Clientes, Veículos e Predição.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('health', 'Saúde da aplicação e do banco')
    .addTag('auth', 'Autenticação e autorização (JWT + RBAC)')
    .addTag('customers', 'Gestão de clientes')
    .addTag('vehicles', 'Gestão de veículos (VIN)')
    .addTag('predictions', 'Predição de perfil e risco de evasão (serve o Motor de ML)')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port);

  logger.log(`🚀 API rodando em http://localhost:${port}/api`);
  logger.log(`📘 Swagger (contrato) em http://localhost:${port}/docs`);
  logger.log(`❤️  Health check em http://localhost:${port}/health`);
}

void bootstrap();
