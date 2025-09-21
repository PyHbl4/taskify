import { registerAs } from '@nestjs/config';

export interface TokensConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
  argon2Pepper: string;
}

const ensureEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not defined`);
  }
  return value;
};

export default registerAs<TokensConfig>('tokens', () => ({
  accessSecret: ensureEnv('JWT_ACCESS_SECRET'),
  refreshSecret: ensureEnv('JWT_REFRESH_SECRET'),
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  argon2Pepper: ensureEnv('ARGON2_PEPPER'),
}));
