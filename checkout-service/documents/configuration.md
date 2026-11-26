# Configuration and startup

Reviewed: 2026-11-24 (initial checkout-service baseline).

Configuration in `checkout-service` currently combines direct `process.env` reads with NestJS `ConfigService`. There is no startup validation schema, and `ConfigModule.forRoot()` is not yet registered in [`src/app.module.ts`](../src/app.module.ts). See [`.env.example`](../.env.example) for the planned variable list; most variables listed there are not yet read by active code.

## Environment variables

### Variables read by current code

| Variable | Default when absent | Status | Reader and behavior |
| --- | --- | --- | --- |
| `PORT` | `8003` | Active | [`src/main.ts`](../src/main.ts) uses `process.env.PORT \|\| 8003` (both omitted and empty string fall back to `8003`) |
| `RABBITMQ_URL` | `amqp://admin:admin@localhost:5672` | Active | [`RabbitmqService`](../src/events/rabbitmq/rabbitmq.service.ts) reads `configService.get<string>('RABBITMQ_URL', 'amqp://admin:admin@localhost:5672')` during `onModuleInit()` |
| `DB_HOST` | `localhost` | Unwired | [`src/config/database.config.ts`](../src/config/database.config.ts) uses `process.env.DB_HOST \|\| 'localhost'` |
| `DB_PORT` | `5432` | Unwired | [`src/config/database.config.ts`](../src/config/database.config.ts) uses `process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432` (no `NaN` check for non-numeric values) |
| `DB_USERNAME` | `postgres` | Unwired | [`src/config/database.config.ts`](../src/config/database.config.ts) uses `process.env.DB_USERNAME \|\| 'postgres'` |
| `DB_PASSWORD` | `postgres` | Unwired | [`src/config/database.config.ts`](../src/config/database.config.ts) uses `process.env.DB_PASSWORD \|\| 'postgres'` |
| `DB_DATABASE` | `checkout_db` | Unwired | [`src/config/database.config.ts`](../src/config/database.config.ts) uses `process.env.DB_DATABASE \|\| 'checkout_db'` |
| `NODE_ENV` | None | Unwired | [`src/config/database.config.ts`](../src/config/database.config.ts) sets `synchronize: process.env.NODE_ENV !== 'production'` and `logging: process.env.NODE_ENV === 'development'` |

### Variables declared in `.env.example` but not read by any source file yet

`JWT_SECRET`, `JWT_EXPIRES_IN`, `USERS_SERVICE_URL`, `PRODUCTS_SERVICE_URL`, `PAYMENTS_SERVICE_URL`, `RABBITMQ_QUEUE_PAYMENTS`, and `RABBITMQ_EXCHANGE` appear in [`.env.example`](../.env.example) as placeholders for upcoming features, but no active or unwired code reads them yet.

## Load timing and `.env` caveat

- **`.env` is not loaded automatically:** [`EventsModule`](../src/events/events.module.ts) imports `ConfigModule` directly without calling `ConfigModule.forRoot(...)` in [`AppModule`](../src/app.module.ts). As a result, `ConfigService` reads from `process.env` as provided by the launching shell/process environment rather than parsing a local `.env` file automatically.
- **Import-time reads in `database.config.ts`:** [`src/config/database.config.ts`](../src/config/database.config.ts) evaluates `process.env.*` at module import time when it is eventually imported, before any async NestJS factory runs. See [ADR 0002](ADR/0002-persistence-configuration.md) and [known limitations](development-status/limitations.md).
- **No runtime schema validation:** `ConfigService.get<string>(...)` provides a TypeScript type annotation only; malformed URLs, non-numeric `DB_PORT`, or missing production secrets are not rejected at startup.

## Fixed bootstrap options

- **CORS:** `app.enableCors()` in [`src/main.ts`](../src/main.ts) uses NestJS/Express defaults (permissive origin handling, no explicit allowlist).
- **Global `ValidationPipe`:** Configured in [`src/main.ts`](../src/main.ts) with:
  - `whitelist: true` — strips properties without `class-validator` decorators on DTO classes.
  - `forbidNonWhitelisted: true` — rejects requests containing unexpected properties with HTTP 400.
  - `transform: true` — transforms plain payloads to DTO class instances and converts primitive types when typed.
- **RabbitMQ defaults:** `RabbitmqService` connects with `amqplib` default socket/heartbeat settings and publishes to durable `topic` exchanges with `persistent: true` and `contentType: 'application/json'`. See [RabbitMQ implementation](implementation/rabbitmq.md).

## Alignment with API Gateway and Messaging

- Default HTTP port `8003` matches the `CHECKOUT_SERVICE_URL` default (`http://localhost:8003`) in the API Gateway.
- Default `RABBITMQ_URL` (`amqp://admin:admin@localhost:5672`) matches the local RabbitMQ container credentials and AMQP port in [`../messaging/docker-compose.yml`](../../messaging/docker-compose.yml).

## Source and related documents

- [`.env.example`](../.env.example), [`src/main.ts`](../src/main.ts), [`src/app.module.ts`](../src/app.module.ts), [`src/config/database.config.ts`](../src/config/database.config.ts), [`src/events/rabbitmq/rabbitmq.service.ts`](../src/events/rabbitmq/rabbitmq.service.ts)
- [Architecture](architecture.md)
- [Operations](operations.md)
- [ADR 0002: Persistence configuration](ADR/0002-persistence-configuration.md)
