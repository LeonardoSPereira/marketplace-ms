# ADR 0002: RabbitMQ versus Kafka, SQS, and other messaging systems

- Recorded: 2026-11-23
- Status: Recorded; exchange/queue topology, client library choice, and production hardening remain open.
- Scope: Retrospective record of the RabbitMQ broker selection visible in `docker-compose.yml` for asynchronous `checkout` <-> `payments` communication compared with Apache Kafka, Amazon SQS, Redis Streams/PubSub, and NATS.

## Context

To support asynchronous communication between the future `checkout` and `payments` services (see [ADR 0001](0001-async-messaging-vs-sync-http.md)), the project needs a message broker that fits an educational NestJS microservices environment while supporting reliable transactional command/event routing, explicit consumer acknowledgments, retries, and dead-lettering.

The repository configures RabbitMQ (`rabbitmq:4-management`) in [`docker-compose.yml`](../../docker-compose.yml). This record documents why a traditional AMQP broker fits the `checkout` <-> `payments` workflow compared with log-streaming platforms, cloud-managed queues, and lightweight in-memory brokers, as well as the limitations of the current container configuration.

## Recorded decision and implementation

Use **RabbitMQ 4** (`rabbitmq:4-management`) running via Docker Compose as the message broker for `checkout` and `payments` communication:

- **Image and runtime:** `rabbitmq:4-management` in container `marketplace-rabbitmq`, exposing AMQP on port `5672` and the management HTTP UI/API on port `15672`.
- **Persistence:** Named Docker volume `rabbitmq_data` mounted at `/var/lib/rabbitmq` with `restart: unless-stopped`.
- **Default local credentials:** `RABBITMQ_DEFAULT_USER: admin` and `RABBITMQ_DEFAULT_PASS: admin` hardcoded in [`docker-compose.yml`](../../docker-compose.yml) (`LIM-001`).
- **Container health check:** Executes `rabbitmq-diagnostics -q ping` every `30s` with `timeout: 30s` and `retries: 5`.

**Why RabbitMQ fits this project:**

- **Direct and topic routing via AMQP exchanges:** Supports direct, topic, fanout, and headers exchanges out of the box, making it straightforward to route payment commands from `checkout` to `payments` and payment outcome events back to `checkout` (with room to bind additional listeners later without changing the producer).
- **Per-message acknowledgments and dead-lettering:** Built-in consumer `ack`/`nack`, configurable prefetch (`QoS`), message TTLs, and Dead-Letter Exchanges (DLX) match transactional checkout/payment workflows where individual message delivery and poison-message isolation matter more than raw log throughput.
- **First-class NestJS and Node.js ecosystem support:** Integrates directly with NestJS (`@nestjs/microservices` RmqTransport, `amqplib`, or `@golevelup/nestjs-rabbitmq`) and includes a built-in web management UI (`:15672`) for inspecting exchanges, queues, bindings, and message payloads during learning and debugging.
- **Self-contained local execution:** Runs locally in a single lightweight container without requiring cloud accounts or multi-node cluster orchestration.

## Alternatives

| System | Strengths | Trade-offs for this project |
| --- | --- | --- |
| **Apache Kafka** | High-throughput distributed commit log, ordered partition replay, long-term event retention, stream processing. | Heavier operational footprint (JVM memory, partition rebalancing); lacks per-message arbitrary acknowledgment/dead-letter routing without custom retry topics; overkill for point-to-point/event coordination between `checkout` and `payments` in a learning baseline. |
| **Amazon SQS (+ SNS)** | Fully managed, zero broker maintenance, native AWS IAM integration, simple queue semantics. | Requires AWS cloud provisioning or a local emulator (such as LocalStack); SQS alone provides point-to-point queues and needs SNS pairing for pub/sub routing; introduces cloud vendor coupling. |
| **Redis (Pub/Sub or Streams)** | Extremely low latency; often already deployed for caching or rate-limiting counters. | Redis Pub/Sub is fire-and-forget with no persistence for offline consumers; Redis Streams adds consumer groups and persistence but lacks AMQP's rich routing topologies, management UI, and dead-letter semantics for payment workflows. |
| **NATS / NATS JetStream** | Very lightweight binary, fast request-reply and pub/sub, low resource usage. | Less common in standard e-commerce enterprise tutorials compared with RabbitMQ/Kafka; fewer community patterns for complex AMQP-style routing in NestJS. |

Listing these alternatives compares architectural trade-offs; it does not prevent future services from evaluating event streaming or cloud queues if requirements change.

## Consequences and limitations

- **Broker-centric state:** RabbitMQ is designed to hold messages until consumed and acknowledged by `payments` or `checkout`, not to serve as an immutable, indefinitely replayable event store like Kafka. Once acknowledged, messages are removed from the queue.
- **Known configuration limitations in `docker-compose.yml`:**
  - `LIM-001`: Default credentials (`admin` / `admin`) are committed directly in [`docker-compose.yml`](../../docker-compose.yml) without `.env` parameterization.
  - `LIM-002`: Exchanges, queues, bindings, virtual hosts, and dead-letter policies for `checkout` and `payments` are not pre-declared via definition files or startup code yet (`GAP-001`, `GAP-003`).
- **Library choice still pending:** While NestJS provides a built-in RMQ transporter (`@nestjs/microservices`), it relies on queue-level RPC/event patterns rather than full AMQP topic exchanges unless paired with custom channel management or a dedicated library such as `amqplib` / `@golevelup/nestjs-rabbitmq` (`DEC-004`).

## Open questions

Tracked in the [open questions register](../development-status/open-questions.md):

- `DEC-004`: Which Node.js / NestJS library (`@nestjs/microservices` RMQ transporter, raw `amqplib`, or `@golevelup/nestjs-rabbitmq`) will `checkout` and `payments` use to connect, and will a shared wrapper package live in `messaging/`?
- `DEC-005`: Should the `checkout` <-> `payments` exchanges, queues, dead-letter exchanges (DLX), and bindings be bootstrapped declaratively via RabbitMQ `definitions.json` in `messaging/` or asserted at runtime by each service?
- `DEC-006`: How should broker credentials, virtual hosts, and connection URLs be parameterized across `.env` files for local development versus container networking?

## Evidence

- [docker-compose.yml](../../docker-compose.yml)
