export const setupTestEnvironment = () => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = process.env.PORT ?? '0';
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ?? 'postgres://test:test@localhost:5432/test';
  process.env.JWT_ACCESS_SECRET =
    process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';
  process.env.JWT_ACCESS_EXPIRES_IN =
    process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
  process.env.JWT_REFRESH_EXPIRES_IN =
    process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
  process.env.ARGON2_PEPPER =
    process.env.ARGON2_PEPPER ?? 'test-pepper-value';
  process.env.CORS_ORIGIN =
    process.env.CORS_ORIGIN ?? 'http://localhost:3000';
};
