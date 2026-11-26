# Not implemented or not wired

Snapshot: 2026-11-24 (initial checkout-service baseline).
All entries remain open. These are verified observations of `checkout-service/`, not an audit of other services or an approved implementation backlog. See the [development-status index](README.md) for scope and conventions.

| ID | Current absence | Evidence and scope |
| --- | --- | --- |
| GAP-001 | PostgreSQL connection, TypeORM module registration, entities, and migrations | [`src/config/database.config.ts`](../../src/config/database.config.ts) exists but is not imported by [`AppModule`](../../src/app.module.ts); no entity or migration files exist. [ADR 0002](../ADR/0002-persistence-configuration.md), [Architecture](../architecture.md) |
| GAP-002 | Checkout/order domain modules, HTTP endpoints, DTOs, and RabbitMQ consumers | Only the starter `GET /` route in [`AppController`](../../src/app.controller.ts) is active; `RabbitmqService.publishMessage` has no caller, [`PaymentOrderMessage`](../../src/events/payment-queue.interface.ts) is unused, and `src/common/dto/` is empty. [Architecture](../architecture.md), [RabbitMQ implementation](../implementation/rabbitmq.md) |
| GAP-003 | Health check endpoints (`/health`, `/health/ready`, `/health/live`) | No health controller or RabbitMQ/DB readiness probes exist yet. [Operations](../operations.md) |
| GAP-004 | Authentication and authorization guards | JWT/Passport packages are installed in [`package.json`](../../package.json) and `JWT_*` vars are listed in [`.env.example`](../../.env.example), but no auth module, strategy, or guard is implemented or registered. [Architecture](../architecture.md), [Configuration](../configuration.md) |
| GAP-005 | Synchronous HTTP clients and resilience wrappers for downstream services (`users`, `products`) | `@nestjs/axios` is installed and `USERS_SERVICE_URL` / `PRODUCTS_SERVICE_URL` are listed in [`.env.example`](../../.env.example), `src/common/circuit-breaker/` is empty, and no HTTP client module/adapter is implemented. [Architecture](../architecture.md), [Configuration](../configuration.md) |
| GAP-006 | Startup environment validation and Swagger/OpenAPI documentation | No schema validates environment variables at startup, and no Swagger module or route is configured. [Configuration](../configuration.md), [Architecture](../architecture.md) |

