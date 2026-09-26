import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

/**
 * Configuração global da aplicação. Compartilhada por main.ts e pelos testes
 * e2e, para que os testes exercitem a API exatamente como ela roda.
 */
export function configureApp(app: INestApplication): void {
  // Cabeçalhos de segurança HTTP (Cybersecurity).
  app.use(helmet());

  // CORS restrito a domínios autorizados (Cybersecurity: proteção de APIs).
  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins.length ? origins : true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
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
}

/** Contrato OpenAPI 3 da API (servido em /docs e exportado em docs/openapi.json). */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Ford Conecta — API (Web Services)')
    .setDescription(
      'Camada de Serviços REST da plataforma Ford Conecta — FIAP Ford 2026, Desafio 02.\n\n' +
        '**Autenticação:** faça `POST /api/auth/login`, copie o `accessToken` e clique em ' +
        '**Authorize**. Rotas sem cadeado são públicas.\n\n' +
        '**Papéis:** `admin` (tudo), `analyst` (pós-venda da concessionária) e ' +
        '`customer` (dono do veículo, só os próprios dados).\n\n' +
        '**Erros:** toda resposta de erro segue o schema `ErrorResponseDto`.',
    )
    .setVersion('2.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('health', 'Saúde da aplicação e do banco (público)')
    .addTag('auth', 'Cadastro, login (emissão do JWT) e perfil autenticado')
    .addTag('users', 'Administração de usuários e vínculo com cliente (admin)')
    .addTag('customers', 'Clientes (donos de veículos)')
    .addTag('vehicles', 'Veículos (VIN), em JSON ou XML')
    .addTag('dealerships', 'Concessionárias da rede oficial')
    .addTag('predictions', 'Perfil e risco de evasão (serve o Motor de ML)')
    .build();
  return SwaggerModule.createDocument(app, config);
}

export function setupSwagger(app: INestApplication): void {
  SwaggerModule.setup('docs', app, buildOpenApiDocument(app), {
    swaggerOptions: { persistAuthorization: true },
  });
}
