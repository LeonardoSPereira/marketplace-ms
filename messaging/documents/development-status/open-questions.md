# Open architecture and contract questions

Snapshot: 2026-11-23 (initial messaging workspace baseline).
All entries remain open. Alternatives in the ADRs are options for discussion, not evidence of approval or a requirement to implement every option. See the [status index](README.md) for maintenance conventions.

| ID | Decision still needed | Existing context |
| --- | --- | --- |
| DEC-001 | What exact message contracts (commands and events, e.g., payment initiation and payment outcome notification) will connect the future `checkout` and `payments` services? | [ADR 0001](../ADR/0001-async-messaging-vs-sync-http.md) |
| DEC-002 | How should `checkout` coordinate synchronous HTTP validation against `users` and `products` before publishing asynchronous payment messages to `payments` (e.g., direct publish vs. transactional outbox)? | [ADR 0001](../ADR/0001-async-messaging-vs-sync-http.md), [API Gateway ADR 0002](../../../api-gateway/documents/ADR/0002-service-communication.md) |
| DEC-003 | What message envelope format, schema validation, versioning strategy, and correlation headers should be required across `checkout` and `payments`? | [ADR 0001](../ADR/0001-async-messaging-vs-sync-http.md), [ADR 0003](../ADR/0003-topology-contracts-and-reliability.md) |
| DEC-004 | Which NestJS / Node.js messaging library (`@nestjs/microservices` RMQ transporter, `amqplib`, or `@golevelup/nestjs-rabbitmq`) will `checkout` and `payments` adopt, and should `messaging/` host a shared TypeScript package? | [ADR 0002](../ADR/0002-rabbitmq-vs-other-brokers.md), [ADR 0003](../ADR/0003-topology-contracts-and-reliability.md) |
| DEC-005 | Should exchanges, queues, bindings, and dead-letter queues (DLQ) for `checkout` and `payments` be seeded by RabbitMQ `definitions.json` in `messaging/` or asserted at startup by each owning microservice? | [ADR 0002](../ADR/0002-rabbitmq-vs-other-brokers.md), [ADR 0003](../ADR/0003-topology-contracts-and-reliability.md) |
| DEC-006 | How should broker credentials, virtual hosts, and connection URLs be parameterized across local host execution and Docker Compose networks? | [ADR 0002](../ADR/0002-rabbitmq-vs-other-brokers.md), [configuration guide](../configuration.md) |
