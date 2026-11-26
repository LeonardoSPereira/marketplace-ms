# Open architecture and contract questions

Snapshot: 2026-11-24 (initial checkout-service baseline).
All entries remain open. Alternatives listed in ADRs are options for evaluation, not approved decisions or commitments. See the [development-status index](README.md) for maintenance rules.

| ID | Decision still needed | Existing context |
| --- | --- | --- |
| DEC-001 | Should `checkout-service` keep direct `amqplib` (adding reconnection, confirm channels, and caller-visible errors) or adopt a higher-level NestJS RabbitMQ library (such as `@golevelup/nestjs-rabbitmq` or `@nestjs/microservices`)? | [ADR 0001](../ADR/0001-rabbitmq-integration.md), [Messaging DEC-004](../../../messaging/documents/development-status/open-questions.md) |
| DEC-002 | What exact exchange names, routing keys, queues, dead-letter queues, and message envelope schema (including runtime validation, `eventId`, `correlationId`, and versioning) will connect `checkout-service` and `payments`? | [ADR 0001](../ADR/0001-rabbitmq-integration.md), [RabbitMQ implementation](../implementation/rabbitmq.md), [Messaging ADR 0003](../../../messaging/documents/ADR/0003-topology-contracts-and-reliability.md) |
| DEC-003 | How will `checkout-service` coordinate order persistence with RabbitMQ publishing (direct publish vs. transactional outbox) so database state and payment events cannot diverge on failure? | [ADR 0001](../ADR/0001-rabbitmq-integration.md), [Messaging DEC-002](../../../messaging/documents/development-status/open-questions.md) |
| DEC-004 | Should PostgreSQL configuration use `TypeOrmModule.forRootAsync` with `ConfigService` and `autoLoadEntities: true` instead of static import-time `databaseConfig`? | [ADR 0002](../ADR/0002-persistence-configuration.md), [Configuration](../configuration.md) |
| DEC-005 | What checkout and order domain model, state machine transitions, and schema migration strategy (TypeORM migrations vs. dev-only `synchronize`) will `checkout-service` adopt? | [ADR 0002](../ADR/0002-persistence-configuration.md), [Architecture](../architecture.md) |
| DEC-006 | How will `checkout-service` validate authenticated user identity (JWT verification locally vs. trusted headers from `api-gateway`) and handle synchronous HTTP failures/timeouts to `users` and `products`? | [Architecture](../architecture.md), [API Gateway ADR 0003](../../../api-gateway/documents/ADR/0003-authentication-context.md) |
