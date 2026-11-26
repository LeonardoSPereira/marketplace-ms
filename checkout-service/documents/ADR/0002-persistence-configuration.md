# ADR 0002: PostgreSQL and TypeORM persistence configuration

- Recorded: 2026-11-24
- Status: Recorded (retrospective, unwired); module registration, migration strategy, and lifecycle questions remain open.
- Scope: Observed persistence dependencies in [`package.json`](../../package.json) and the unwired configuration file [`src/config/database.config.ts`](../../src/config/database.config.ts).

## Context

`checkout-service` will own checkout and order data in its own database. The repository installs `@nestjs/typeorm`, `typeorm`, and `pg` in [`package.json`](../../package.json) and contains an initial PostgreSQL configuration object in [`src/config/database.config.ts`](../../src/config/database.config.ts), though no database module or entities are registered yet.

## Recorded decision and implementation state

- **Configured in code (unwired):**
  - [`src/config/database.config.ts`](../../src/config/database.config.ts) exports a `TypeOrmModuleOptions` object targeting `type: 'postgres'` with defaults `localhost:5432`, user `postgres`, password `postgres`, and database `checkout_db`.
  - `entities` is configured via glob `[import.meta.dirname + '/../**/*.entity{.ts,.js}']`.
  - `synchronize` is enabled whenever `process.env.NODE_ENV !== 'production'`, and SQL `logging` is enabled only when `process.env.NODE_ENV === 'development'`.
- **Not implemented or wired:**
  - `TypeOrmModule.forRoot(...)` / `TypeOrmModule.forRootAsync(...)` is not imported in [`AppModule`](../../src/app.module.ts).
  - No TypeORM entities, repositories, or database migrations exist yet (`GAP-001`).

## Alternatives

- **`TypeOrmModule.forRootAsync` with `ConfigService` and `autoLoadEntities: true`:** Defers reading environment variables until NestJS `ConfigModule.forRoot()` has loaded `.env`, validates configuration cleanly, and avoids filesystem glob paths (`__dirname`) in ESM builds.
- **Explicit migrations instead of `synchronize: true`:** Requires generating and running TypeORM migration files, adding workflow overhead during early learning, but prevents accidental schema drops and mirrors production database practices.
- **Alternative ORMs / query builders (e.g., Prisma or Drizzle):** Offer stronger compile-time query typing and schema-first workflows, but are not installed in this service.

## Consequences and limitations

- Because `databaseConfig` is not imported by `AppModule`, the application currently starts and runs without connecting to PostgreSQL.
- `databaseConfig` reads `process.env` at module import time rather than through `ConfigService`, and parses `DB_PORT` with `parseInt` without checking for `NaN` (`LIM-005`).
- Enabling `synchronize` whenever `NODE_ENV !== 'production'` means an unset `NODE_ENV` activates automatic schema synchronization.

## Open questions

Tracked in the [open questions register](../development-status/open-questions.md):

- `DEC-004`: When wiring PostgreSQL, should `AppModule` use `TypeOrmModule.forRootAsync` with `ConfigService` and `autoLoadEntities: true` instead of static import-time `databaseConfig`?
- `DEC-005`: Will `checkout-service` use TypeORM migrations or keep `synchronize` restricted to local development, and what entities/tables will model checkouts, orders, and order items?

## Source evidence

- [`package.json`](../../package.json)
- [`src/config/database.config.ts`](../../src/config/database.config.ts)
- [`src/app.module.ts`](../../src/app.module.ts)
- [Configuration guide](../configuration.md)
