# RabbitMQ integration

Reviewed: 2026-11-24 (initial `EventsModule`, `RabbitmqService`, and `PaymentOrderMessage` implementation).

This guide explains the current RabbitMQ integration implemented in [`src/events/`](../../src/events/). For architectural context and broker selection across services, see [ADR 0001: RabbitMQ integration](../ADR/0001-rabbitmq-integration.md) and [Messaging ADR 0001](../../../messaging/documents/ADR/0001-async-messaging-vs-sync-http.md).

## Module registration and exports

[`EventsModule`](../../src/events/events.module.ts):

- Imports `ConfigModule` (bare import; `ConfigModule.forRoot()` is not yet called in [`AppModule`](../../src/app.module.ts)).
- Registers and exports [`RabbitmqService`](../../src/events/rabbitmq/rabbitmq.service.ts).
- Is imported by [`AppModule`](../../src/app.module.ts), so `RabbitmqService` is instantiated and its NestJS lifecycle hooks execute on every application startup and shutdown.

No other module currently injects `RabbitmqService`.

## Connection lifecycle (`RabbitmqService`)

`RabbitmqService` uses `amqplib` directly and implements NestJS `OnModuleInit` and `OnModuleDestroy`:

1. **Startup (`onModuleInit` -> `connect`):**
   - Reads `RABBITMQ_URL` from `ConfigService` with default `'amqp://admin:admin@localhost:5672'`.
   - Opens a connection (`amqp.connect(rabbitmqUrl)`) and a standard AMQP channel (`this.connection.createChannel()`).
   - Attaches connection event listeners for `'error'`, `'close'`, `'blocked'`, and `'unblocked'`, logging each event via NestJS `Logger`.
   - **Non-fatal failure:** If connecting or creating the channel throws, the error is caught and logged (`⚠️ Failed to connect to RabbitMQ, continuing without message queue`). The NestJS application continues starting with `this.connection` and `this.channel` unassigned.
2. **Shutdown (`onModuleDestroy` -> `disconnect`):**
   - Closes `this.channel` (if defined) and then `this.connection` (if defined), logging any disconnect error without rethrowing.
3. **Accessors:**
   - `getChannel()` and `getConnection()` return the underlying `amqplib` `Channel` and `ChannelModel` instances. They are typed as non-optional, though both can be `undefined` at runtime if startup connection failed or after disconnect.

## Publishing behavior (`publishMessage`)

`publishMessage(exchange: string, routingKey: string, message: unknown): Promise<void>`:

1. **Channel guard:** If `this.channel` is falsy, logs a warning (`channel not available, skipping message publish`) and returns early without throwing.
2. **Exchange assertion:** Calls `this.channel.assertExchange(exchange, 'topic', { durable: true })` on every publish call.
3. **Serialization and publish:** Serializes `message` via `Buffer.from(JSON.stringify(message))` and calls `this.channel.publish(exchange, routingKey, messageBuffer, options)` with:
   - `persistent: true` (delivery mode 2 — requests broker disk persistence when routed to durable queues)
   - `timestamp: Date.now()`
   - `contentType: 'application/json'`
4. **Backpressure check and error handling:**
   - Logs the serialized message at debug level (`this.logger.debug(...)`).
   - Throws `new Error('Failed to publish message to RabbitMQ')` when `channel.publish(...)` returns `false` (AMQP write buffer backpressure), which is immediately caught by the surrounding `try/catch`.
   - **Errors are swallowed:** The `catch` block logs the error and returns normally (`Promise<void>`), so callers cannot currently detect publish failures, backpressure, or missing channels from the returned promise.

## Message contract (`payment-queue.interface.ts`)

[`src/events/payment-queue.interface.ts`](../../src/events/payment-queue.interface.ts) defines two TypeScript interfaces for future payment messages:

- `PaymentOrderMessageItem`: `{ productId: string; quantity: number; price: number }`
- `PaymentOrderMessage`: `{ orderId: string; userId: string; amount: number; items: PaymentOrderMessageItem[]; paymentMethod: string; description?: string; createdAt?: Date }`

These interfaces are currently unused in source code and provide compile-time typing only (no runtime schema validation, envelope metadata such as `eventId` / `correlationId`, or versioning).

## Current limitations

- **No automatic reconnection:** If RabbitMQ restarts or drops the connection after startup, `connection.on('close')` logs a warning but does not reconnect or clear/recreate `this.channel` (`LIM-001`).
- **No publisher confirms or caller-visible failure:** Uses a regular `Channel` rather than `ConfirmChannel`, and `publishMessage` catches and swallows errors (`LIM-004`).
- **No consumer support:** Queue assertion, bindings, dead-letter queues, manual `ack`/`nack`, and message consumption (e.g., receiving payment outcomes back from `payments`) are not implemented (`GAP-002`).
- **Debug payload logging:** `publishMessage` logs full serialized message content at debug level (`LIM-003`).

## Source and related documents

- [`src/events/events.module.ts`](../../src/events/events.module.ts)
- [`src/events/rabbitmq/rabbitmq.service.ts`](../../src/events/rabbitmq/rabbitmq.service.ts)
- [`src/events/payment-queue.interface.ts`](../../src/events/payment-queue.interface.ts)
- [ADR 0001: RabbitMQ integration](../ADR/0001-rabbitmq-integration.md)
- [Development status](../development-status/README.md)
