# Marketplace Messaging - Under development

A learning project for studying backend development, NestJS, and microservices.
This workspace provides the message-broker infrastructure and messaging architecture documentation for the marketplace microservices project. At least for the current phase, asynchronous messaging via RabbitMQ is scoped specifically to communications between the future `checkout` and `payments` services, while all other service interactions use synchronous HTTP.

**The messaging layer, the API gateway, and the other services that will form this microservices project are under active development.** A substantial part of the intended system is still missing and will be added as the project evolves. Current functionality is an incremental learning baseline, not a complete marketplace or a claim of production readiness. The [development-status register](documents/development-status/README.md) tracks missing functionality, known limitations, and open decisions observed in this messaging workspace; it does not audit the other services' implementation status.

## Run locally

```sh
docker compose up -d
```

The broker uses `rabbitmq:4-management` in container `marketplace-rabbitmq`. It exposes AMQP 0-9-1 on `amqp://localhost:5672` and the RabbitMQ Management UI/HTTP API on `http://localhost:15672`.

Default credentials in [`docker-compose.yml`](docker-compose.yml) are `RABBITMQ_DEFAULT_USER: admin` and `RABBITMQ_DEFAULT_PASS: admin`. These values are applied when the named volume `rabbitmq_data` (`/var/lib/rabbitmq`) is first initialized; editing them later without removing the volume (`docker compose down -v`) does not replace existing user credentials.

Use `docker compose ps` and `docker compose logs -f rabbitmq` to inspect container state. See [operations](documents/operations.md) for health-check behavior and troubleshooting.

## Documentation

- [Development status](documents/development-status/README.md): missing or unwired capabilities, configuration limitations, and unresolved architecture questions.
- [ADR index](documents/ADR/README.md): decisions recorded from the current setup, their alternatives, consequences, and unresolved questions.
- [Architecture](documents/architecture.md), [configuration](documents/configuration.md), and [operations](documents/operations.md).
- [Understanding asynchronous messaging, AMQP, and RabbitMQ](documents/async-messaging-concepts.md): core concepts (AMQP, exchanges, queues, acks, DLX/DLQ, retries, durability, idempotency, transactional outbox) and a `checkout` <-> `payments` walk-through.

## Documentation checklist

Checked items mean the document exists, not that all architectural questions or implementation limitations are resolved. ADRs describe the current repository state and architectural trade-offs rather than claim historical approval.

- [x] [Architecture overview: broker role and communication boundaries](documents/architecture.md).
- [x] [ADR 0001: asynchronous messaging versus synchronous HTTP communication](documents/ADR/0001-async-messaging-vs-sync-http.md).
- [x] [ADR 0002: RabbitMQ versus Kafka, SQS, and other messaging systems](documents/ADR/0002-rabbitmq-vs-other-brokers.md).
- [x] [ADR 0003: broker topology, message contracts, and delivery reliability boundaries](documents/ADR/0003-topology-contracts-and-reliability.md).
- [x] [Asynchronous messaging, AMQP, and RabbitMQ concepts](documents/async-messaging-concepts.md).
- [x] [Configuration guide: container settings, defaults, and persistence](documents/configuration.md).
- [x] [Operations guide: startup, health checks, and troubleshooting](documents/operations.md).
- [x] [Development-status register: gaps, limitations, and open questions](documents/development-status/README.md).
- [ ] Follow-up ADR: selected NestJS RMQ client library and shared package boundaries.
- [ ] Follow-up ADR: exchange/queue topology, dead-lettering (DLX/DLQ), and retry policy for `checkout` and `payments`.
- [ ] Follow-up ADR: `checkout` <-> `payments` event envelope schema, versioning, and idempotency contracts.

## Current functionalities

- [`docker-compose.yml`](docker-compose.yml) defines a single `rabbitmq` service (`rabbitmq:4-management`) named `marketplace-rabbitmq` with `restart: unless-stopped`.
- AMQP traffic is published on port `5672` and the web management UI/HTTP API is published on port `15672`.
- Broker data persists across container restarts in the named Docker volume `rabbitmq_data` mounted at `/var/lib/rabbitmq`.
- Default local credentials (`admin` / `admin`) are configured via `RABBITMQ_DEFAULT_USER` and `RABBITMQ_DEFAULT_PASS`.
- A container health check runs `rabbitmq-diagnostics -q ping` every `30s` with a `30s` timeout and `5` retries.

Current limitations (details in the [status register](documents/development-status/limitations.md)):

- Default credentials (`admin` / `admin`) and ports are hardcoded directly in [`docker-compose.yml`](docker-compose.yml) without `.env` parameterization (`LIM-001`, `GAP-005`).
- No exchanges, queues, bindings, dead-letter exchanges (DLX), or virtual hosts for `checkout` and `payments` are pre-seeded on startup (`GAP-001`, `GAP-003`, `LIM-002`).
- No producer/consumer application code, NestJS transport module, or shared event contract package is implemented in this directory yet (`GAP-002`).
