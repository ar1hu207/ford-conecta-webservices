import { NestFactory } from '@nestjs/core';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../app.module';
import { buildOpenApiDocument, configureApp } from '../app.setup';

/**
 * Exporta o contrato OpenAPI para docs/openapi.json (entregável versionado).
 * Rode com: npm run openapi:export   (precisa do banco no ar, como a API).
 */
async function run(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  configureApp(app);
  await app.init();

  const document = buildOpenApiDocument(app);
  const outDir = join(process.cwd(), 'docs');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'openapi.json'), JSON.stringify(document, null, 2));

  await app.close();
  // eslint-disable-next-line no-console
  console.log(`OpenAPI exportado: docs/openapi.json (${Object.keys(document.paths).length} paths)`);
}

void run();
