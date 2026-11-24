# Understanding asynchronous messaging, AMQP, and RabbitMQ

Created: 2026-11-23

This learning guide explains the core concepts behind asynchronous messaging, AMQP, and RabbitMQ, then connects them to the marketplace's `checkout` <-> `payments` boundary. For the current container setup, configuration, and unresolved decisions, see [architecture](architecture.md), [configuration](configuration.md), and the [ADR index](ADR/README.md).

## Why asynchronous messaging?

In synchronous HTTP, Service A sends a request to Service B and holds the connection open until Service B finishes and replies. That works well for reads and immediate checks (such as logging in or fetching a product catalog), where the caller cannot proceed without an instant answer.

Now imagine a user clicks **Place Order** in the `checkout` service, and `checkout` must charge the user through the `payments` service:

- If `payments` is temporarily restarting or slow because an external payment gateway is lagging, a synchronous HTTP call stalls the user's checkout request or times out.
- If `checkout` times out while `payments` actually succeeded a second later, the two services end up out of sync.

Asynchronous messaging puts a durable **message broker** (RabbitMQ) between them. `checkout` records the order in an initial state (such as `PENDING_PAYMENT`), publishes a message to RabbitMQ, and immediately returns a response to the caller. `payments` consumes the message at its own pace, processes the payment, and publishes a result message back for `checkout` to update the order status (`PAID` or `PAYMENT_FAILED`).

## What is AMQP?

**AMQP** (Advanced Message Queuing Protocol) is the open wire-level protocol that RabbitMQ speaks (specifically **AMQP 0-9-1** on TCP port `5672` by default).

Unlike simple queue systems where a producer pushes directly into a named queue, AMQP separates **routing** from **storage**:

- **Producer (Publisher):** The service that creates and sends a message (for example, `checkout` publishing a payment request).
- **Exchange:** The broker's routing post office. Producers always publish to an **exchange**, never directly to a queue.
- **Routing Key:** A short string attached to each message by the producer (for example, `payment.requested` or `payment.succeeded`) that the exchange inspects to decide where the message goes.
- **Binding:** A rule linking an exchange to a queue (often with a routing key or pattern).
- **Queue:** A durable buffer inside the broker that stores messages until a consumer processes and acknowledges them.
- **Consumer:** The service that subscribes to a queue and processes messages (for example, `payments`).

```mermaid
flowchart LR
    P["Producer (checkout)"] -->|"publish(routingKey)"| E["Exchange"]
    E -->|"binding rule"| Q1["Queue (payments.process)"]
    Q1 -->|"deliver"| C1["Consumer (payments)"]
    C1 -->|"ack / nack"| Q1
```

### Connections, channels, and virtual hosts

- **Connection:** A long-lived TCP connection between a NestJS service and RabbitMQ (`amqp://admin:admin@localhost:5672`). Opening TCP connections is relatively expensive, so a service typically keeps one connection open.
- **Channel:** A lightweight multiplexed session *inside* a single TCP connection. Publishing, consuming, declaring queues, and acknowledging messages all happen over channels.
- **Virtual Host (`vhost`):** A logical namespace inside RabbitMQ (default `/`) that isolates exchanges, queues, users, and permissions—similar to separate databases inside one database server.

## Exchange types

RabbitMQ provides four standard AMQP exchange types. Choosing the right one determines how routing keys and bindings work:

| Exchange type | How it routes messages | Common marketplace use case |
| --- | --- | --- |
| **Direct** | Exact match between the message's `routingKey` and the binding key. | Point-to-point commands, such as sending `payment.process` directly to the `payments` work queue. |
| **Topic** | Wildcard pattern matching on dot-separated routing keys (`*` matches exactly one word; `#` matches zero or more words). | Domain events where routing can evolve, e.g., `payment.*` or `checkout.order.#`. |
| **Fanout** | Ignores routing keys and broadcasts a copy to *every* bound queue. | Broadcasting an event to multiple independent subscribers (e.g., notifications, analytics, audit logs). |
| **Headers** | Matches on message header key-value pairs instead of routing keys. | Rare; useful only when routing depends on multiple metadata attributes. |

## Commands vs. events

Even though both travel as messages over RabbitMQ, they express different intent:

- **Command** (imperative, e.g., `ProcessPayment`): Tells a specific target service to do something. Usually routed to one owning queue (`checkout` -> `payments`).
- **Event** (past tense, e.g., `PaymentSucceeded`, `PaymentFailed`): Announces a fact that already happened. The publisher does not care who listens; today only `checkout` may consume it, and later a notification service could bind a second queue to the same exchange without changing `payments`.

## Acknowledgments (`ack`, `nack`, `reject`) and prefetch (`QoS`)

When RabbitMQ delivers a message to a consumer, it needs to know when it is safe to delete that message from the queue:

- **Auto-ack (`noAck: true`):** RabbitMQ deletes the message the instant it writes it to the network socket. If the consumer crashes mid-processing, the message is permanently lost. Avoid this for financial or order workflows.
- **Manual ack (`noAck: false`):** The consumer explicitly replies after finishing its work:
  - **`ack`:** Processing succeeded; RabbitMQ permanently removes the message.
  - **`nack` / `reject` with `requeue: true`:** Processing failed; put the message back in the queue for another attempt. (Caution: if the bug is permanent, immediate requeueing causes an infinite tight loop.)
  - **`nack` / `reject` with `requeue: false`:** Do not put it back in the main queue; drop it or route it to a **Dead-Letter Exchange (DLX)** if configured.

**Prefetch (`basic.qos`):** Limits how many *unacknowledged* messages RabbitMQ will push to a consumer at once (for example, `prefetch = 1` or `10`). Without a prefetch limit, RabbitMQ can flood one worker with thousands of messages in memory while other worker instances sit idle.

## Dead-Letter Exchanges (DLX) and Dead-Letter Queues (DLQ)

Some messages cannot be processed even after retries—for example, malformed JSON, a missing required field, or a permanent business-rule violation. These are called **poison messages**.

A **Dead-Letter Exchange (DLX)** is a regular RabbitMQ exchange configured on a queue (`x-dead-letter-exchange`) that automatically receives messages whenever any of the following occur:

1. A consumer rejects or negatively acknowledges the message with `requeue: false`.
2. The message's Time-To-Live (`TTL`) expires before it is consumed.
3. The queue exceeds its maximum length limit (`x-max-length`).

A **Dead-Letter Queue (DLQ)** is simply the queue bound to that DLX. Instead of blocking the main queue or discarding failed messages silently, the DLQ holds them safely so developers can inspect the payload, read the `x-death` headers (which record why and how many times the message was dead-lettered), fix the bug, and replay or discard them.

```mermaid
flowchart TD
    M["Main Queue (payments.process)"] --> C["Consumer (payments)"]
    C -->|"Success"| ACK["ack (message removed)"]
    C -->|"Transient error (retry count < max)"| R["Retry Queue (with TTL)"]
    R -->|"TTL expires -> DLX back to main"| M
    C -->|"Permanent error or max retries exceeded (nack requeue=false)"| DLX["Dead-Letter Exchange (dlx)"]
    DLX --> DLQ["Dead-Letter Queue (payments.process.dlq)"]
```

Notice how **delayed retries** are commonly built in RabbitMQ using the exact same DLX mechanism: a failed message is published to a retry queue with a per-message or per-queue TTL (for example, 5 seconds) and no active consumer; when the TTL expires, RabbitMQ dead-letters it back into the main exchange for another attempt.

## Delivery guarantees, durability, and idempotency

### Durability and persistence

To survive a RabbitMQ container restart, three things must align:

1. **Durable exchanges and queues (`durable: true`):** Survive broker restarts (otherwise RabbitMQ deletes the queue definition on shutdown).
2. **Persistent messages (`deliveryMode: 2` / `persistent: true`):** Tells RabbitMQ to write the message to disk (inside the `rabbitmq_data` volume) rather than keeping it only in RAM.
3. **Publisher confirms:** RabbitMQ sends an asynchronous confirmation back to the producer once the message has been safely accepted (and flushed to disk for persistent messages).

### At-least-once delivery and idempotency

In distributed systems, **exactly-once delivery** across network boundaries is not guaranteed by the broker alone. If `payments` charges a card and crashes right before sending `ack` to RabbitMQ, RabbitMQ will redeliver the same message to another consumer—this is **at-least-once delivery**.

Because duplicates can happen, consumers must be **idempotent**: processing the same message twice must produce the same final state as processing it once. Common techniques include:

- Including a unique `eventId` or `idempotencyKey` (such as `orderId` + payment attempt ID) in every message envelope.
- Recording processed message IDs in the consumer's database (with a unique constraint) inside the same transaction as the state update, and safely `ack`ing duplicates without re-running the side effect.

### The dual-write problem and the transactional outbox

When `checkout` saves an order to its database and then publishes a message to RabbitMQ, those are two separate systems. If the database commit succeeds and the process crashes before publishing to RabbitMQ, `payments` never hears about the order.

The **Transactional Outbox** pattern solves this: `checkout` writes the order *and* an outbox event row in the same local database transaction, and a background relay reads unpublished outbox rows and publishes them to RabbitMQ (marking them published after publisher confirm). Whether `checkout` uses direct publishing or an outbox is tracked as `DEC-002` in [open questions](development-status/open-questions.md).

## Walk-through: `checkout` <-> `payments`

Putting these concepts together for the marketplace's planned messaging boundary ([ADR 0001](ADR/0001-async-messaging-vs-sync-http.md)):

1. **Client -> API Gateway -> `checkout` (HTTP):** The user submits a checkout request over synchronous HTTP. `checkout` validates user/product data (synchronously via HTTP if needed), saves the order as `PENDING_PAYMENT`, and publishes a persistent `payment.requested` message (with a unique `orderId`, `eventId`, and `correlationId`) to RabbitMQ.
2. **`checkout` -> Client (HTTP):** `checkout` immediately responds to the client with the created order in `PENDING_PAYMENT` state instead of waiting for external payment settlement.
3. **RabbitMQ -> `payments` (AMQP):** RabbitMQ routes the message to `payments`'s durable queue. `payments` consumes it with manual `ack` and a bounded prefetch count.
4. **`payments` processing:** `payments` checks idempotency (has this `orderId` / `eventId` already been processed?), processes the payment, persists its payment record, publishes `payment.succeeded` (or `payment.failed`) to RabbitMQ, and `ack`s the incoming message.
5. **RabbitMQ -> `checkout` (AMQP):** `checkout` consumes the payment outcome message, updates the order to `PAID` or `PAYMENT_FAILED` idempotently, and `ack`s the message.
6. **Failure path:** If a transient error occurs, the message retries with backoff; if it fails permanently or exhausts retries, it is `nack`ed with `requeue: false` into a DLQ for inspection.

## How this maps to the repository right now

Today, only the broker infrastructure is implemented:

- [`docker-compose.yml`](../docker-compose.yml) runs `rabbitmq:4-management` (`marketplace-rabbitmq`) with AMQP on port `5672`, the management UI on port `15672`, persistent storage in `rabbitmq_data` (`/var/lib/rabbitmq`), and a `rabbitmq-diagnostics -q ping` health check.
- **Not yet implemented:** No exchanges, queues, bindings, DLXs, retry policies, message envelope schemas, or NestJS producer/consumer modules exist in `messaging/` yet (`GAP-001` through `GAP-003`).
- **Open design choices:** Exact `checkout` <-> `payments` event contracts (`DEC-001`), outbox vs. direct publish (`DEC-002`), message envelope schema (`DEC-003`), NestJS RMQ client library (`DEC-004`), and whether topology is seeded via `definitions.json` or asserted by each service (`DEC-005`) are tracked in [open questions](development-status/open-questions.md) and [ADR 0003](ADR/0003-topology-contracts-and-reliability.md).
