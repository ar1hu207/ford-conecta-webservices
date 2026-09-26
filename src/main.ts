import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp, setupSwagger } from './app.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  configureApp(app);
  setupSwagger(app);

  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port);

  logger.log(`🚀 API rodando em http://localhost:${port}/api`);
  logger.log(`📘 Swagger (contrato) em http://localhost:${port}/docs`);
  logger.log(`❤️  Health check em http://localhost:${port}/health`);
}

void bootstrap();
