import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1710000000000 implements MigrationInterface {
  name = 'InitSchema1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" text NOT NULL,
        "passwordHash" text NOT NULL,
        "roles" text[] NOT NULL DEFAULT ARRAY['user']::text[],
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")',
    );

    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "status" text NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_projects_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_projects_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "IDX_projects_userId" ON "projects" ("userId")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_projects_status" ON "projects" ("status")',
    );

    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "projectId" uuid NOT NULL,
        "title" text NOT NULL,
        "description" text,
        "status" text NOT NULL DEFAULT 'backlog',
        "priority" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tasks_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tasks_project" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "IDX_tasks_projectId" ON "tasks" ("projectId")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_tasks_status" ON "tasks" ("status")',
    );

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tokenId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "tokenHash" text NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revokedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_refresh_tokens_tokenId" ON "refresh_tokens" ("tokenId")',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_refresh_tokens_tokenHash" ON "refresh_tokens" ("tokenHash")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_refresh_tokens_tokenHash"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_refresh_tokens_tokenId"',
    );
    await queryRunner.query('DROP TABLE "refresh_tokens"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tasks_status"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tasks_projectId"');
    await queryRunner.query('DROP TABLE "tasks"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_projects_status"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_projects_userId"');
    await queryRunner.query('DROP TABLE "projects"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_users_email"');
    await queryRunner.query('DROP TABLE "users"');
  }
}
