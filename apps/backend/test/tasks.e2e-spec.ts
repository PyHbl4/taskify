import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestingApp } from './utils/create-app';
import { setupTestEnvironment } from './utils/setup-env';

describe('Projects and Tasks (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let accessToken: string;
  let projectId: string;

  beforeAll(async () => {
    setupTestEnvironment();
    app = await createTestingApp();
    server = app.getHttpServer();

    const authResponse = await request(server)
      .post('/auth/register')
      .send({
        email: 'tasks-user@example.com',
        password: 'Password123!',
      })
      .expect(201);

    accessToken = authResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a project', async () => {
    const response = await request(server)
      .post('/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'My Project',
        description: 'Demo project',
      })
      .expect(201);

    projectId = response.body.id;
    expect(response.body).toMatchObject({
      name: 'My Project',
      description: 'Demo project',
      status: 'active',
    });
  });

  it('creates a task within the project', async () => {
    const response = await request(server)
      .post('/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        projectId,
        title: 'Initial task',
        status: 'todo',
        priority: 2,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      projectId,
      title: 'Initial task',
      status: 'todo',
      priority: 2,
    });
  });

  it('returns tasks filtered by status and project', async () => {
    const response = await request(server)
      .get('/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ status: 'todo', projectId })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      projectId,
      status: 'todo',
    });
  });
});
