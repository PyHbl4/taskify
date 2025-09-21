import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestingApp } from './utils/create-app';
import { setupTestEnvironment } from './utils/setup-env';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let server: any;
  const email = 'test-user@example.com';
  const password = 'Password123!';

  beforeAll(async () => {
    setupTestEnvironment();
    app = await createTestingApp();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a new user', async () => {
    const response = await request(server)
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    expect(response.body).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      user: {
        email,
        roles: ['user'],
      },
    });
  });

  it('logs in an existing user', async () => {
    const response = await request(server)
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.user.email).toBe(email);
  });
});
