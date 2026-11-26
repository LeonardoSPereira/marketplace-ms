# Known implementation limitations

Snapshot: 2026-11-24 (initial checkout-service baseline).
All entries remain open. These limitations describe constrained behavior in existing `checkout-service/` files; they are separate from [absent capabilities](not-implemented.md) and [open decisions](open-questions.md).

| ID | Current limitation | Effect and reference |
| --- | --- | --- |
| LIM-001 | Non-fatal RabbitMQ startup failure with no automatic reconnection | [`RabbitmqService.connect()`](../../src/events/rabbitmq/rabbitmq.service.ts) catches startup errors and leaves `connection`/`channel` undefined; if RabbitMQ drops later, `'close'` is logged without reconnecting, causing publishes to be skipped until restart. [RabbitMQ implementation](../implementation/rabbitmq.md), [ADR 0001](../ADR/0001-rabbitmq-integration.md) |
| LIM-002 | `ConfigModule.forRoot()` is not registered in `AppModule` | [`EventsModule`](../../src/events/events.module.ts) imports bare `ConfigModule`, so local `.env` files are not loaded automatically; only shell-exported variables are visible to `ConfigService` and `process.env`. [Configuration](../configuration.md), [Operations](../operations.md) |
| LIM-003 | `RabbitmqService.publishMessage` logs full serialized payloads at debug level | Line 125 of [`src/events/rabbitmq/rabbitmq.service.ts`](../../src/events/rabbitmq/rabbitmq.service.ts) calls `this.logger.debug(...)` with `JSON.stringify(message)` (marked debug-only, to be removed before production), which can expose sensitive order/payment payloads when debug logs are enabled. [RabbitMQ implementation](../implementation/rabbitmq.md), [Operations](../operations.md) |
| LIM-004 | `RabbitmqService.publishMessage` uses a non-confirm channel and swallows all errors | Uses `createChannel()` instead of `createConfirmChannel()`, asserts the exchange on every call, and catches/logs publish or backpressure errors without rethrowing, so callers cannot detect failed publishes. [RabbitMQ implementation](../implementation/rabbitmq.md), [ADR 0001](../ADR/0001-rabbitmq-integration.md) |
| LIM-005 | Unwired `database.config.ts` uses import-time env reads and permissive `synchronize` | [`src/config/database.config.ts`](../../src/config/database.config.ts) reads `process.env` at import time, parses `DB_PORT` without `NaN` validation, and enables `synchronize` whenever `NODE_ENV !== 'production'`. [ADR 0002](../ADR/0002-persistence-configuration.md), [Configuration](../configuration.md) |
| LIM-006 | Permissive default CORS and `console.log` startup banner | [`src/main.ts`](../../src/main.ts) calls `app.enableCors()` without origin restrictions and logs startup via `console.log` rather than NestJS `Logger`. [Configuration](../configuration.md), [Operations](../operations.md) |

Documentation records these constraints without changing runtime behavior. An under-development status provides context, not a substitute for documenting known limitations or a claim of production readiness.
