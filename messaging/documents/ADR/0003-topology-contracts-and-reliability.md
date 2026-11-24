# ADR 0003: Broker topology, message contracts, and delivery reliability boundaries

- Recorded: 2026-11-23
- Status: Recorded; topology definitions, shared contract ownership, and failure handling remain open.
- Scope: Retrospective record of the current infrastructure-only state of `messaging/` and the architectural decisions required before connecting the future `checkout` and `payments` services.

## Context

With RabbitMQ selected as the message broker ([ADR 0002](0002-rabbitmq-vs-other-brokers.md)) for asynchronous communication between the future `checkout` and `payments` services ([ADR 0001](0001-async-messaging-vs-sync-http.md)), connecting those two services requires explicit conventions for:

1. **Where shared messaging code or configuration lives** (whether `messaging/` remains an infrastructure-only Docker workspace or also hosts shared TypeScript contracts/utilities for `checkout` and `payments`).
2. **Exchange and queue topology** (naming, durable queues, topic vs. direct routing between `checkout` and `payments`).
3. **Reliability guarantees** (publisher confirms, consumer manual acknowledgments, retry backoff, dead-letter queues, and idempotency so payment commands and status updates are never lost or applied twice).

Currently, `messaging/` contains only [`docker-compose.yml`](../../docker-compose.yml) and repository documentation. No `package.json`, TypeScript sources, or RabbitMQ definition files exist in this directory.

## Recorded decision and implementation

Record the current baseline as an **infrastructure-only broker workspace** while tracking the topology, contract, and reliability boundaries that must be resolved before `checkout` and `payments` integration:

- **Infrastructure isolation:** RabbitMQ runs as a standalone Docker Compose service (`marketplace-rabbitmq`) inside `messaging/`, decoupled from any single NestJS microservice process so `checkout` and `payments` can connect to `amqp://localhost:5672` during local development.
- **No pre-wired application code:** No shared npm package, NestJS module, or pre-seeded RabbitMQ definitions are implemented yet (`GAP-001`, `GAP-002`, `GAP-003`).

## Alternatives

- **Infrastructure-only `messaging/` directory + service-owned contracts:** Keep `messaging/` strictly for Docker Compose and broker configuration files (such as `definitions.json`), while `checkout` and `payments` define their own NestJS messaging adapters and DTOs. Avoids cross-service build dependencies, but risks contract drift between producer and consumer.
- **Shared TypeScript package in `messaging/`:** Add a `package.json` and shared NestJS module / event contract types inside `messaging/` imported by `checkout` and `payments` via workspace links. Centralizes event schemas and connection helpers, but couples service builds and versioning to a shared library.
- **Broker-seeded topology vs. application-asserted topology:**
  - *Broker-seeded (`definitions.json`):* RabbitMQ creates the `checkout` and `payments` exchanges, queues, and DLXs on container startup. Centralizes visibility, but requires restarting or reloading broker definitions when topology changes.
  - *Application-asserted (`assertExchange` / `assertQueue` at bootstrap):* `checkout` and `payments` assert their own queues and bindings on startup. Self-contained per service, but requires strict naming discipline across both services.

## Consequences and limitations

- Because no topology or client wrappers exist yet, starting `docker compose up` launches an empty RabbitMQ instance with only the default virtual host (`/`) and built-in AMQP default exchanges (`LIM-002`).
- Without established dead-letter queues (`DLX`), manual acknowledgment policies, and retry limits, naive consumer implementations in `checkout` or `payments` risk infinite redelivery loops (poison messages) or silent message loss if auto-ack (`noAck: true`) is used.

## Open questions

Tracked in the [open questions register](../development-status/open-questions.md):

- `DEC-003`: What envelope schema (e.g., `eventId`, `eventType`, `occurredAt`, `correlationId`, `version`, `payload`) should wrap messages exchanged between `checkout` and `payments`?
- `DEC-004`: Will `messaging/` host a shared TypeScript/NestJS library for `checkout` and `payments` or remain an infrastructure and documentation workspace?
- `DEC-005`: Who owns exchange/queue assertion and dead-letter queue (DLQ) retry policies for the `checkout` <-> `payments` channels?

## Evidence

- [docker-compose.yml](../../docker-compose.yml)
- [Development status register](../development-status/README.md)
