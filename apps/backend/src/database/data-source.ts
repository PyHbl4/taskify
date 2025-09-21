import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/orm.config';

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
loadEnv({ path: join(process.cwd(), envFile) });

export const AppDataSource = new DataSource(buildDataSourceOptions());

export default AppDataSource;
