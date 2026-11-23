# Architecture and messaging flow

Reviewed: 2026-11-23

The `messaging/` workspace provides the local message-broker infrastructure for the marketplace microservices project. This document describes what is currently present in `messaging/`; downstream producer and consumer implementations in other services have not been audited here.

## Composition

| Component | Current responsibility |
| --- | --- |
| [`docker-compose.yml`](../docker-compose.yml) | Define the `rabbitmq` service (`rabbitmq:4-management`), exposed ports, default credentials, named volume, restart policy, and container health check |
| `marketplace-rabbitmq` container | Run RabbitMQ 4 with the AMQP 0-9-1 listener (`5672`) and management HTTP UI/API (`15672`) |
| `rabbitmq_data` volume | Persist broker node data under `/var/lib/rabbitmq` across container restarts |

No `package.json`, NestJS application module, producer/consumer adapter, or pre-seeded exchange/queue definition file is present in this directory (`GAP-001`, `GAP-002`).

## Communication boundaries

As recorded in [ADR 0001](ADR/0001-async-messaging-vs-sync-http.md):

- **Asynchronous messaging (`RabbitMQ`)** ([ADR 0002](ADR/0002-rabbitmq-vs-other-brokers.md)) is scoped specifically to communications between the future **`checkout`** and **`payments`** services (at least for the current phase), decoupling order checkout initiation from asynchronous payment processing and payment outcome notifications.
- **Synchronous HTTP** remains the protocol for all other service interactions, including client-facing routing through the [API Gateway](../../api-gateway/README.md), authentication (`users`), product catalog queries (`products`), and direct synchronous validation.

## Current runtime flow

1. Docker Compose starts the `marketplace-rabbitmq` container from `rabbitmq:4-management`.
2. RabbitMQ initializes default user `admin` (when `/var/lib/rabbitmq` is first created) and listens for AMQP connections on TCP port `5672` and management HTTP connections on TCP port `15672`.
3. Docker periodically runs the configured container health check (`rabbitmq-diagnostics -q ping`) every `30s` with a `30s` timeout and `5` retries.
4. No application containers or host services in this workspace automatically connect to port `5672` on startup. Any exchanges, queues, or bindings for `checkout` and `payments` must currently be created manually via the management UI or asserted by external client processes (`LIM-002`).

## Source and related documents

- [Docker Compose definition](../docker-compose.yml)
- [ADR 0001: Asynchronous messaging versus synchronous HTTP](ADR/0001-async-messaging-vs-sync-http.md)
- [ADR 0002: RabbitMQ versus other brokers](ADR/0002-rabbitmq-vs-other-brokers.md)
- [ADR 0003: Broker topology, contracts, and reliability](ADR/0003-topology-contracts-and-reliability.md)
- [Configuration](configuration.md), [operations](operations.md)
