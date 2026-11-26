# Architecture and request flow

Reviewed: 2026-11-24 (initial checkout-service baseline with global validation, CORS, `EventsModule` / `RabbitmqService`, and unwired `database.config.ts`).

`checkout-service` is an ESM NestJS 12 application using Express (`@nestjs/platform-express`). This document describes only what is currently implemented and wired in `checkout-service/`; other microservices in this workspace have not been audited here.

## Service boundaries

- **Intended domain:** Checkout and order workflows, communicating asynchronously with the future `payments` service via RabbitMQ (see [Messaging ADR 0001](../../messaging/documents/ADR/0001-async-messaging-vs-sync-http.md)) and synchronously via HTTP with other services (such as `users` and `products`) as those integrations are added.
- **Current active surface:** Only the starter `GET /` HTTP route and the `RabbitmqService` lifecycle connection hook are active at runtime. No checkout/order domain modules, controllers, database connection, authentication guards, or RabbitMQ consumers are wired yet.

## Composition

| Component | File | Current status | Responsibility |
| --- | --- | --- | --- |
| Bootstrap | [`src/main.ts`](../src/main.ts) | Active | Creates the NestJS app, enables CORS, registers a global `ValidationPipe`, and listens on `PORT \|\| 8003` |
| Root module | [`src/app.module.ts`](../src/app.module.ts) | Active | Composes `EventsModule`, `AppController`, and `AppService` |
| Starter controller/service | [`src/app.controller.ts`](../src/app.controller.ts), [`src/app.service.ts`](../src/app.service.ts) | Active | Exposes `GET /` returning `'Hello World!'` |
| Events module | [`src/events/events.module.ts`](../src/events/events.module.ts) | Active | Imports `ConfigModule`, provides and exports `RabbitmqService` |
| RabbitMQ service | [`src/events/rabbitmq/rabbitmq.service.ts`](../src/events/rabbitmq/rabbitmq.service.ts) | Active (startup/shutdown); `publishMessage` has no caller | Connects to RabbitMQ on `OnModuleInit`, closes on `OnModuleDestroy`, and exposes `publishMessage`, `getChannel`, and `getConnection` |
| Payment message contract | [`src/events/payment-queue.interface.ts`](../src/events/payment-queue.interface.ts) | Type-only, unused | Declares `PaymentOrderMessage` and `PaymentOrderMessageItem` TypeScript interfaces |
| Database configuration | [`src/config/database.config.ts`](../src/config/database.config.ts) | Unwired | Defines a PostgreSQL `TypeOrmModuleOptions` object; `TypeOrmModule` is not imported in `AppModule` |
| Empty scaffolding folders | `src/common/circuit-breaker/`, `src/common/dto/` | Empty | Directory placeholders with no source files yet |

Installed packages in [`package.json`](../package.json) such as `@nestjs/typeorm`, `typeorm`, `pg`, `@nestjs/axios`, `axios`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, and `bcryptjs` do not activate features on their own until registered in NestJS modules.

## Startup and active request flow

### Application bootstrap

1. [`src/main.ts`](../src/main.ts) calls `NestFactory.create(AppModule)`.
2. During module initialization, NestJS invokes `RabbitmqService.onModuleInit()` (from the imported [`EventsModule`](../src/events/events.module.ts)), which attempts to open an AMQP connection and channel via `amqplib`. If RabbitMQ is unreachable, the error is logged and bootstrap continues without a message queue (see [RabbitMQ implementation guide](implementation/rabbitmq.md)).
3. `app.enableCors()` enables default permissive CORS headers.
4. `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))` registers request payload validation and transformation globally. Because no DTO-backed endpoints exist yet, this pipe has no DTO contracts to enforce on the starter route.
5. `app.listen(process.env.PORT || 8003)` starts the HTTP server and logs the URL via `console.log`.

### Active HTTP request path

1. Incoming HTTP requests pass through Express CORS middleware and the global `ValidationPipe`.
2. `GET /` is handled by [`AppController.getHello`](../src/app.controller.ts), which delegates to [`AppService.getHello`](../src/app.service.ts) and returns `'Hello World!'`.
3. No authentication guards, rate limiting, logging middleware, Swagger routes, or health endpoints are registered.

### Asynchronous messaging path (internal helper only)

`EventsModule` exports `RabbitmqService`, which provides `publishMessage(exchange, routingKey, message)` for durable `topic` exchanges with JSON serialization. No controller or domain service currently injects or calls `RabbitmqService`, and no RabbitMQ consumer is implemented. See [RabbitMQ implementation](implementation/rabbitmq.md) for connection lifecycle, publishing semantics, and error behavior.

## Source and related documents

- [Bootstrap](../src/main.ts), [root module](../src/app.module.ts), [events module](../src/events/events.module.ts)
- [Configuration](configuration.md)
- [Operations](operations.md)
- [RabbitMQ implementation](implementation/rabbitmq.md)
- [ADR index](ADR/README.md)
- [Development status](development-status/README.md)
