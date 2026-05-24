import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './database.config';

/**
 * DataSource usado pela CLI do TypeORM para gerar/rodar/reverter migrations.
 * Ex.: npm run migration:run
 */
const dataSource = new DataSource(buildDataSourceOptions());

export default dataSource;
