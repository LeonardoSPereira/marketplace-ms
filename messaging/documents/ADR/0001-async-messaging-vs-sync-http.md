# ADR 0001: Asynchronous messaging versus synchronous HTTP communication

- Recorded: 2026-11-23
- Status: Recorded; checkout-to-payments event contracts, producer/consumer wiring, and delivery guarantees remain open.
- Scope: Architectural boundary defining why asynchronous messaging is scoped specifically to communications between the future `checkout` and `payments` services while other marketplace interactions use synchronous HTTP.

## Context

The marketplace microservices project is under active development and comprises four target domain services (`users`, `products`, `checkout`, and `payments`) behind the [API Gateway](../../../api-gateway/README.md).

Up to this point, the API Gateway has relied exclusively on synchronous HTTP calls (see the gateway's [ADR 0002](../../../api-gateway/documents/ADR/0002-service-communication.md)) because authentication, health probes, and direct client queries require immediate request-response outcomes before answering the caller.

However, the interaction between `checkout` and `payments` has different reliability and latency characteristics from standard read/query or authentication flows: payment processing involves external or asynchronous settlement steps, retry horizons that should not block a user's checkout HTTP request, and state transitions where orders must be recorded durably even if the payments service is temporarily slow or restarting. To support this without overcomplicating the rest of the system, the `messaging/` directory introduces dedicated message-broker infrastructure via [`docker-compose.yml`](../../docker-compose.yml). No producer or consumer application code or shared contracts are wired yet (tracked as `GAP-001` and `GAP-002` in [not-implemented](../development-status/not-implemented.md)).

## Recorded decision and implementation

Adopt a targeted hybrid communication model across the marketplace microservices:

1. **Use asynchronous messaging (`RabbitMQ`) strictly between `checkout` and `payments` (at least for the current project phase):**
   - **Checkout -> Payments decoupling:** When a checkout workflow initiates payment processing, or when `payments` reports payment outcomes (such as authorization, capture, or failure) back to `checkout`, communication uses asynchronous messages over RabbitMQ rather than blocking HTTP calls.
   - **Temporal decoupling and durability:** Buffering checkout/payment events and commands in the broker ensures payment spikes or temporary downstream unavailability do not drop checkout requests or hold open long-lived HTTP connections.
   - **General criteria for async messaging:** Operations where work can proceed outside the client's immediate HTTP response window, where durable delivery and retries matter more than immediate synchronous reply, or where state changes occur asynchronously.

2. **Use synchronous HTTP (`request/response`) for all other service communications:**
   - **API Gateway to downstream services:** Client-facing routing, authentication (`users`), product catalog browsing (`products`), initiating checkout requests, and health probes remain standard synchronous HTTP.
   - **Reads, queries, and immediate validation:** Any cross-service lookup involving `users` or `products` (or client queries for current order/payment status) uses synchronous HTTP where the caller needs an immediate authoritative response.

**Current implementation state:** Only the local RabbitMQ broker container definition exists in [`docker-compose.yml`](../../docker-compose.yml). The `checkout` and `payments` services and their messaging adapters are not implemented in this workspace yet.

## Alternatives

- **Synchronous HTTP for all inter-service communication (including `checkout` <-> `payments`):** Simpler initial setup without a message broker. Rejected for the checkout-to-payments boundary because payment processing latency, retries, or temporary payment-service downtime would directly fail or stall checkout HTTP requests and risk inconsistent order/payment state.
- **Asynchronous messaging across all microservices (`users`, `products`, `checkout`, `payments`, and `api-gateway`):** Routing every service interaction through broker queues. Rejected because `users` authentication and `products` queries require immediate synchronous responses, and introducing broker queues for every service adds unnecessary complexity to a learning baseline.
- **Database-level integration (shared database tables or polling between `checkout` and `payments`):** Allowing `checkout` and `payments` to read or write each other's tables directly. Rejected because it violates microservice data ownership and couples internal schemas.

## Consequences and limitations

- **Clear, bounded messaging scope:** Only `checkout` and `payments` need RabbitMQ client dependencies and queue consumers for now; `api-gateway`, `users`, and `products` remain pure HTTP participants.
- **Eventual consistency in checkout/payment state:** Because payment processing runs asynchronously after checkout initiation, checkout records must model intermediate states (e.g., `PENDING_PAYMENT`, `PAID`, `PAYMENT_FAILED`) rather than assuming payment settles inside the initial checkout HTTP call.
- **Idempotency and delivery semantics:** Because broker delivery is typically at-least-once, `payments` and `checkout` consumers must be idempotent (keyed by order or payment attempt ID) so duplicate messages do not double-charge or corrupt order status. No idempotency, dead-letter queue (DLQ), or retry topology is implemented yet (`GAP-003`).
- **Observability across HTTP and AMQP:** Tracing a checkout request from the HTTP gateway into the `checkout` -> `payments` queues requires propagating correlation IDs in message headers (`GAP-004`).

## Open questions

Tracked in the [open questions register](../development-status/open-questions.md):

- `DEC-001`: What exact message contracts (commands vs. domain events, e.g., `checkout.order_created` / `payments.payment_requested` and `payments.payment_succeeded` / `payments.payment_failed`) will connect `checkout` and `payments`?
- `DEC-002`: If `checkout` needs user or product validation before publishing to `payments` (or if stock reservation is added later), will `checkout` validate synchronously via HTTP against `users`/`products` before publishing the payment message?
- `DEC-003`: What schema format, versioning strategy, and correlation metadata will be enforced on `checkout` <-> `payments` message payloads?

## Evidence

- [docker-compose.yml](../../docker-compose.yml)
- [API Gateway ADR 0002: Synchronous HTTP communication](../../../api-gateway/documents/ADR/0002-service-communication.md)
