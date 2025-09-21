import { registerAs } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { join } from 'path';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

export type OrmConfig = DataSourceOptions;

const ensureDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not defined');
  }
  return url;
};

export const buildDataSourceOptions = (): DataSourceOptions => {
  const isTest = process.env.NODE_ENV === 'test';

  return {
    type: 'postgres',
    url: ensureDatabaseUrl(),
    entities: [User, Project, Task, RefreshToken],
    migrations: [
      join(__dirname, '../database/migrations/*{.ts,.js}'),
    ],
    migrationsTableName: 'migrations',
    synchronize: false,
    logging: process.env.TYPEORM_LOGGING === 'true',
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    extra: isTest
      ? { max: 1 }
      : undefined,
  } satisfies DataSourceOptions;
};

export default registerAs('orm', () => buildDataSourceOptions());
