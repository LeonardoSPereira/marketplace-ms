# ADR 0001: Direct `amqplib` RabbitMQ integration and topic publishing

- Recorded: 2026-11-24
- Status: Recorded (retrospective); delivery guarantees, reconnection, consumer topology, and message envelope contracts remain open.
- Scope: Observed RabbitMQ client implementation in [`src/events/`](../../src/events/) and its registration in [`AppModule`](../../src/app.module.ts).

## Context

`checkout-service` is intended to communicate asynchronously with the future `payments` service over RabbitMQ ([Messaging ADR 0001](../../../messaging/documents/ADR/0001-async-messaging-vs-sync-http.md), [Messaging ADR 0002](../../../messaging/documents/ADR/0002-rabbitmq-vs-other-brokers.md)). To begin integrating with the local RabbitMQ broker (`amqp://admin:admin@localhost:5672`), the repository introduces an `EventsModule`, a `RabbitmqService` wrapper built directly on `amqplib`, and initial TypeScript interfaces for payment order messages.

## Recorded decision and implementation state

- **Implemented and wired at startup:**
  - [`EventsModule`](../../src/events/events.module.ts) imports `ConfigModule`, provides and exports [`RabbitmqService`](../../src/events/rabbitmq/rabbitmq.service.ts), and is imported by [`AppModule`](../../src/app.module.ts).
  - `RabbitmqService` uses `amqplib` directly, connecting during `OnModuleInit` and closing channel and connection during `OnModuleDestroy`.
  - Startup connection failures are caught and logged so the HTTP service continues starting without RabbitMQ.
  - `publishMessage(exchange, routingKey, message)` asserts a durable `topic` exchange, serializes the payload as JSON with `persistent: true` and `contentType: 'application/json'`, and publishes via a standard AMQP channel.
- **Defined but unused:**
  - [`PaymentOrderMessage` and `PaymentOrderMessageItem`](../../src/events/payment-queue.interface.ts) define a TypeScript payload shape for payment messages, but no service calls `publishMessage` or references these interfaces yet.
- **Not implemented:**
  - Queue declaration, bindings, message consumers, manual acknowledgments, dead-letter queues, publisher confirms, and automatic reconnection are absent.

## Alternatives

- **NestJS `@nestjs/microservices` RabbitMQ transporter:** Integrates with NestJS `@EventPattern` / `@MessagePattern` decorators, but abstracts away direct AMQP exchange/routing-key control and topic exchange topology.
- **`@golevelup/nestjs-rabbitmq`:** Provides NestJS-idiomatic topic exchange publishing, decorators, and built-in reconnection/channel management on top of `amqp-connection-manager`, at the cost of an extra framework dependency.
- **`amqplib` with `amqp-connection-manager` and confirm channels:** Keeps direct AMQP control while adding automatic reconnection and publisher confirms (`createConfirmChannel`) so callers know whether the broker persisted a message.

## Consequences and limitations

- Using `amqplib` directly gives explicit control over topic exchanges, routing keys, and AMQP message properties, which is useful for learning RabbitMQ mechanics.
- Because `connect()` does not retry or reconnect on `'close'` / `'error'` events, a broker restart leaves `RabbitmqService` unable to publish until the NestJS process restarts (`LIM-001`).
- Because `publishMessage()` uses a standard channel and swallows exceptions inside `try/catch`, future callers cannot rely on it to confirm broker delivery or handle failures (`LIM-004`).
- Asserting exchanges dynamically inside `publishMessage()` means exchange topology is created lazily by producers rather than pre-declared at startup or broker seed time.
- Full message payloads are currently logged at debug level (`LIM-003`).

## Open questions

Tracked in the [open questions register](../development-status/open-questions.md):

- `DEC-001`: Should `checkout-service` keep direct `amqplib` (adding reconnection, confirm channels, and caller-visible errors) or adopt a higher-level NestJS RabbitMQ library?
- `DEC-002`: What exact exchange names, routing keys, queues, dead-letter queues, and message envelope fields (such as `eventId`, `correlationId`, `version`) will connect `checkout-service` and `payments`? (See also Messaging `DEC-003`, `DEC-005`.)
- `DEC-003`: Should order persistence and payment message publishing use direct publishing or a transactional outbox pattern so orders and payment events cannot diverge on failure?

## Source evidence

- [`src/app.module.ts`](../../src/app.module.ts)
- [`src/events/events.module.ts`](../../src/events/events.module.ts)
- [`src/events/rabbitmq/rabbitmq.service.ts`](../../src/events/rabbitmq/rabbitmq.service.ts)
- [`src/events/payment-queue.interface.ts`](../../src/events/payment-queue.interface.ts)
- [RabbitMQ implementation guide](../implementation/rabbitmq.md)
