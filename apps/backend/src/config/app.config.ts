import { registerAs } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  corsOrigin?: string;
}

export default registerAs<AppConfig>('app', () => {
  const port = Number(process.env.PORT ?? '4000');
  if (Number.isNaN(port)) {
    throw new Error('PORT environment variable must be a number');
  }

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port,
    corsOrigin: process.env.CORS_ORIGIN,
  } satisfies AppConfig;
});
