# Marketplace Checkout Service - Under development

A learning project for studying backend development, NestJS, and microservices.
This application is the checkout microservice of the marketplace project, intended to manage checkout and order workflows and coordinate asynchronously with the future `payments` service via RabbitMQ (see [Messaging ADR 0001](../messaging/documents/ADR/0001-async-messaging-vs-sync-http.md)).

**The checkout service, the API gateway, the messaging layer, and the other services that will form this microservices project are under active development.** A substantial part of the intended system is still missing and will be added as the project evolves. Current functionality is an early NestJS baseline with initial RabbitMQ publisher scaffolding, not a complete checkout service or a claim of production readiness.

## Run locally

```sh
pnpm install
pnpm run dev
```

The service defaults to `http://localhost:8003` (`process.env.PORT || 8003` in [`src/main.ts`](src/main.ts)), matching the API Gateway's default `CHECKOUT_SERVICE_URL`. To test RabbitMQ connectivity locally, start the shared broker in [`../messaging/`](../messaging/README.md) (`docker compose up -d`); if RabbitMQ is not running, the service logs an error and continues starting without a message queue. Note that `ConfigModule.forRoot()` is not registered yet, so export environment variables in your shell rather than relying on `.env` alone (see [Configuration](documents/configuration.md)).

Use `pnpm run lint` to check code style, `pnpm run lint:fix` to apply automatic fixes, `pnpm run format` to format files with Prettier, and `pnpm run build` to compile the app. Automated test infrastructure has been intentionally removed for now.

## Documentation

- [Repository workflow rules](AGENTS.md): coding, tooling, documentation, and NestJS conventions for this service.
- [Architecture and request flow](documents/architecture.md): active modules, service boundaries, and startup/request flow.
- [Configuration and startup](documents/configuration.md): environment variables, defaults, load timing, and fixed bootstrap options.
- [Operations and troubleshooting](documents/operations.md): commands, health interpretation, logs, and common symptoms.
- [RabbitMQ implementation](documents/implementation/rabbitmq.md): `EventsModule`, `RabbitmqService` lifecycle, topic publishing, and `PaymentOrderMessage`.
- [Architecture Decision Records](documents/ADR/README.md): retrospective ADRs for RabbitMQ integration and persistence configuration.
- [Development status](documents/development-status/README.md): tracked gaps, known limitations, and open architectural questions.
- [Messaging architecture](../messaging/README.md): RabbitMQ broker setup and ADRs covering asynchronous `checkout` <-> `payments` communication.

## Documentation checklist

Checked items mean the document exists, not that all architectural questions or implementation limitations are resolved.

- [x] Architecture overview: module responsibilities, service boundaries, and active request/startup flow ([`documents/architecture.md`](documents/architecture.md)).
- [x] Configuration guide: environment variables, defaults, and load timing ([`documents/configuration.md`](documents/configuration.md)).
- [x] Operations guide: commands, health interpretation, logs, and troubleshooting ([`documents/operations.md`](documents/operations.md)).
- [x] RabbitMQ implementation guide ([`documents/implementation/rabbitmq.md`](documents/implementation/rabbitmq.md)).
- [x] ADR index and initial service ADRs for RabbitMQ integration and persistence configuration ([`documents/ADR/README.md`](documents/ADR/README.md)).
- [x] Development-status register: gaps, limitations, and open questions ([`documents/development-status/README.md`](documents/development-status/README.md)).
- [ ] Checkout/order state machine ADR and domain implementation guide (pending domain implementation).

## Current functionalities

- NestJS 12 (ESM / Express) application composed in [`src/app.module.ts`](src/app.module.ts) and bootstrapped in [`src/main.ts`](src/main.ts) on port `8003` (`PORT` override) with default CORS (`app.enableCors()`) and a global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`).
- Exposes a single starter `GET /` endpoint in [`src/app.controller.ts`](src/app.controller.ts) returning `'Hello World!'` via [`src/app.service.ts`](src/app.service.ts).
- Active [`EventsModule`](src/events/events.module.ts) and [`RabbitmqService`](src/events/rabbitmq/rabbitmq.service.ts) using `amqplib` to connect to RabbitMQ on module init, disconnect on shutdown, and expose `publishMessage` for durable topic exchanges (no callers or consumers wired yet), alongside unused `PaymentOrderMessage` TypeScript interfaces in [`src/events/payment-queue.interface.ts`](src/events/payment-queue.interface.ts).
- Initial PostgreSQL `TypeOrmModuleOptions` file in [`src/config/database.config.ts`](src/config/database.config.ts) (not yet registered in `AppModule`).
- Configured with ESLint (`eslint.config.mjs`), Prettier (`.prettierrc.json`), and TypeScript `@/*` -> `./src/*` path mappings (`tsconfig.json`).

Current limitations (see [`documents/development-status/`](documents/development-status/README.md) for the full register):

- No checkout/order domain modules, DTOs, database registration/entities, authentication guards, health endpoints, Swagger documentation, or RabbitMQ consumers are implemented yet.
- `ConfigModule.forRoot()` is not registered in `AppModule`, so `.env` files are not loaded automatically.
- `RabbitmqService` does not reconnect after disconnect, uses a non-confirm channel, swallows publish errors, and logs serialized payloads at debug level (marked for removal before production).
- Automated test infrastructure and tests are intentionally absent for the current learning phase.
