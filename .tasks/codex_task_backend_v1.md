# Taskify — Backend v1 (NestJS + TypeORM + PostgreSQL): база, API, авторизация, роли

## Контекст
Монорепозиторий **Taskify** (Turborepo). Нужно реализовать **минимально рабочий backend**: база данных (PostgreSQL), ORM (TypeORM), CRUD для ядра (Users/Projects/Tasks), авторизация JWT (access/refresh), guards по ролям, Swagger, e2e тесты. Локальная БД поднимается через Docker Compose. Деплой не нужен.

> Важно: агент **не исполняет shell/npm/docker команды** — вместо этого отдает **полные файлы** (новые/изменённые) и список команд для человека.

---

## Технологии и конвенции
- **Node.js** ≥ 20, **TypeScript** strict.
- **NestJS** 10+, **TypeORM** 0.3+, **PostgreSQL** 16, **pg**.
- Хеш паролей: **argon2** (+ pepper из `.env`).
- JWT: **access ~15m**, **refresh ~7d** (значения в конфиге).
- Время — **UTC**; идентификаторы — **UUID** (v4/v7, на твой выбор, но единообразно).
- Денормализация/индексы — минимально необходимые.
- Валидация: `class-validator`/`class-transformer`.
- Документация API: **Swagger** на `/docs`.

---

## Границы изменения файлов
Изменять/создавать **только** в:
- `apps/backend/**`
- (опционально) `packages/db/**` и `packages/types/**` — если переносишь общие сущности/типы.

> Ничего не ломать в корневом `package.json` и `turbo.json`. Предполагается, что уже есть `workspaces` и актуальный `turbo.json` с `tasks`.

---

## Требуемая структура backend
Внутри `apps/backend` после твоих изменений должны быть (имена могут отличаться, но смысл — такой):

```
apps/backend/
  src/
    main.ts
    app.module.ts
    config/
      app.config.ts
      orm.config.ts        # DataSource options из .env (DATABASE_URL)
      tokens.config.ts
    database/
      data-source.ts       # TypeORM DataSource для миграций
      migrations/          # миграции
      seeds/               # (опц.) сиды для локалки
    common/
      decorators/user.decorator.ts
      decorators/roles.decorator.ts
      guards/jwt-auth.guard.ts
      guards/roles.guard.ts
      interceptors/...
      filters/...
      dtos/...
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      strategies/jwt-access.strategy.ts
      strategies/jwt-refresh.strategy.ts
      dtos/login.dto.ts
      dtos/register.dto.ts
      entities/refresh-token.entity.ts (опц.)
    users/
      users.module.ts
      users.controller.ts
      users.service.ts
      entities/user.entity.ts
      dtos/...
    projects/
      projects.module.ts
      projects.controller.ts
      projects.service.ts
      entities/project.entity.ts
      dtos/...
    tasks/
      tasks.module.ts
      tasks.controller.ts
      tasks.service.ts
      entities/task.entity.ts
      dtos/...
  test/
    jest-e2e.json
    auth.e2e-spec.ts
    tasks.e2e-spec.ts
  swagger.ts               # (опц.) вынос конфигурации Swagger
  .env.example
  package.json             # npm-скрипты (dev/build/migrations/tests)
```

---

## Сущности и миграции (минимум)
### User
- `id: uuid (pk)`
- `email: string (unique, lowercase)`
- `passwordHash: string`
- `roles: text[]` (по умолчанию `['user']`)
- `createdAt, updatedAt: timestamptz`

Индексы: unique(email).

### Project
- `id: uuid (pk)`
- `userId: uuid (fk → User.id)`
- `name: string`
- `description: text | null`
- `status: enum('active','paused','done')` (или text check)
- `createdAt: timestamptz`

Индексы: `(userId)`, `(status)`.

### Task
- `id: uuid (pk)`
- `projectId: uuid (fk → Project.id)`
- `title: string`
- `description: text | null`
- `status: enum('backlog','todo','in_progress','done')`
- `priority: int` (0..3)
- `dueAt: timestamptz | null`
- `createdAt: timestamptz`

Индексы: `(projectId)`, `(status)`, `(priority)`, `(dueAt)`.

> Обязательно: **миграции** на создание этих таблиц и enum/индексов, и **обратные миграции**.

---

## Авторизация и роли
- Регистрация: `POST /auth/register { email, password }`
  - хеш `argon2` (+ pepper из `.env`)
- Логин: `POST /auth/login { email, password }`
  - выдать `accessToken`, `refreshToken`
- Обновление токена: `POST /auth/refresh { refreshToken }`
- Логаут (опц.): инвалидировать refresh (если хранится в БД)

**Guards/Decorators:**
- `JwtAuthGuard` для защищённых маршрутов.
- `@User()` — текущий пользователь из `request.user`.
- `@Roles('admin' | 'user' | ...)` + `RolesGuard`.

**Политика доступа:**
- Пользователь видит/правит **только свои** `Projects`/`Tasks`.
- Пример админского эндпоинта: `GET /users` доступен только роли `admin`.

---

## CRUD и эндпоинты (минимум)
- `GET /users/me` — профиль текущего пользователя (JWT).
- `POST /projects` — создать проект (владельцем становится текущий пользователь).
- `GET /projects` — список проектов текущего пользователя.
- `GET /projects/:id`, `PATCH /projects/:id`, `DELETE /projects/:id`
- `POST /tasks` — создать задачу внутри своего проекта.
- `GET /tasks?status=&projectId=` — фильтры по статусу и проекту.
- `GET /tasks/:id`, `PATCH /tasks/:id`, `DELETE /tasks/:id`

Валидация DTO через `class-validator`. Ошибки — корректные коды и сообщения.

---

## Swagger
- Поднять Swagger на `/docs`.
- Описать все DTO и схемы ответов.
- Отметить охрану JWT (Bearer).

---

## Тесты (e2e)
- Сценарии:
  1) `/auth/register` → 201  
  2) `/auth/login` → 200 + получить `accessToken`  
  3) С `accessToken`: `POST /projects` → 201  
  4) `POST /tasks` (внутри созданного проекта) → 201  
  5) `GET /tasks` с фильтрами → 200 и корректная выборка
- Развёртывание тестовой БД: можно реиспользовать локальную, но лучше — тестовый конфиг и очистка между тестами/схемой.
- Команда: `npm run test:e2e` в `apps/backend`.

---

## npm-скрипты (в `apps/backend/package.json`)
Обязательно добавить:
```json
{
  "name": "@taskify/backend",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "lint": "eslint .",
    "check-types": "tsc -p tsconfig.json --noEmit",

    "migration:generate": "typeorm-ts-node-esm migration:generate src/database/migrations/Auto -d src/database/data-source.ts",
    "migration:run": "typeorm-ts-node-esm migration:run -d src/database/data-source.ts",
    "migration:revert": "typeorm-ts-node-esm migration:revert -d src/database/data-source.ts",

    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

---

## Конфиги окружения (`apps/backend/.env.example`)
```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgres://taskify:taskify@localhost:5432/taskify
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too
ARGON2_PEPPER=pepper-here
CORS_ORIGIN=http://localhost:3000
```

---

## Ожидаемые результаты (Acceptance)
- ✅ Миграции **применяются и откатываются**.
- ✅ JWT авторизация работает (access/refresh).
- ✅ `JwtAuthGuard` и `RolesGuard` подключены; есть минимум один эндпоинт под `@Roles('admin')`.
- ✅ CRUD Users/Projects/Tasks — **только свои данные** пользователя.
- ✅ Swagger доступен на `/docs`, отражает DTO и защиту.
- ✅ e2e тесты зелёные (auth + создание проекта/задачи + выборка).
- ✅ В `apps/backend/package.json` присутствуют все скрипты (dev/build/test/migrations).
- ✅ В `apps/backend/.env.example` заданы переменные, читаемые конфигом.

---

## Что именно нужно отдать (Deliverables)
1) **Полные тексты всех новых/изменённых файлов** (src/**, миграции, тесты, конфиги).  
2) **Инструкции для запуска локально** (в конец ответа):
   - команды для человека (см. ниже).
3) (Опц.) краткие **примечания по архитектурным решениям** (если выбраны нетривиальные варианты).

---

## Команды для человека (после применения твоего патча)
Выполняются **в корне репозитория**:

```bash
# 1) поднять БД Postgres локально (Docker)
docker compose -f infra/docker/docker-compose.yml up -d

# 2) подготовить .env backend
cp apps/backend/.env.example apps/backend/.env

# 3) накатить миграции
npm run --workspace @taskify/backend migration:run

# 4) запустить backend в dev-режиме
npm run dev --filter=@taskify/backend
# или короче, если есть алиас:
# npm run dev:backend
```

Проверка:
- Swagger: http://localhost:4000/docs

---

## Примечания и ограничения
- Не использовать нестабильные/экспериментальные пакеты без необходимости.
- Не хранить секреты в репозитории.
- Код должен проходить `tsc --noEmit` и ESLint (если конфиги есть).
- Строго придерживаться **UTC** для дат/времени.
- Все входные данные валидировать и нормализовать (email — в lowercase).

---
