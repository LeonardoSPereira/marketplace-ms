# Not implemented or not wired

Snapshot: 2026-11-23 (initial messaging workspace baseline).
All entries remain open. These are observations of the `messaging/` directory, not an audit of other service directories or a commitment to implement every capability inside `messaging/`. The [development-status index](README.md) explains scope and maintenance.

| ID | Current absence | Evidence and scope |
| --- | --- | --- |
| GAP-001 | Pre-declared RabbitMQ exchanges, queues, bindings, and virtual hosts for `checkout` and `payments` | [`docker-compose.yml`](../../docker-compose.yml) starts a blank RabbitMQ instance without a mounted `rabbitmq.conf` or `definitions.json`. [ADR 0003](../ADR/0003-topology-contracts-and-reliability.md) |
| GAP-002 | Producer/consumer application code, NestJS transport modules, or shared TypeScript contracts for `checkout` <-> `payments` | `messaging/` contains only [`docker-compose.yml`](../../docker-compose.yml) and documentation; no `package.json` or `src/` exists here. [Architecture](../architecture.md), [ADR 0001](../ADR/0001-async-messaging-vs-sync-http.md) |
| GAP-003 | Dead-letter exchanges (DLX), retry queues, consumer acknowledgment policies, and idempotency guards | No failure-isolation topology or retry/backoff handling is configured yet. [ADR 0003](../ADR/0003-topology-contracts-and-reliability.md) |
| GAP-004 | Message correlation IDs, tracing propagation, and broker metrics integration | Observability is limited to container stdout logs and the local management UI (`:15672`). [Operations](../operations.md) |
| GAP-005 | Environment variable parameterization (`.env.example`) and secret management | Credentials and ports are fixed directly in [`docker-compose.yml`](../../docker-compose.yml). [Configuration](../configuration.md) |
