# Known implementation limitations

Snapshot: 2026-11-23 (initial messaging workspace baseline).
All entries remain open. These limitations concern the current files in `messaging/`; they are separate from [absent capabilities](not-implemented.md) and [decisions still needed](open-questions.md).

| ID | Current limitation | Effect and reference |
| --- | --- | --- |
| LIM-001 | Hardcoded default administrator credentials (`admin` / `admin`) in [`docker-compose.yml`](../../docker-compose.yml) | Suitable only for isolated local development; credentials are not parameterized via environment variables and only take effect on initial volume creation. [Configuration](../configuration.md), [ADR 0002](../ADR/0002-rabbitmq-vs-other-brokers.md) |
| LIM-002 | Broker starts with no pre-seeded topology or resource limits | Only the default `/` vhost and built-in AMQP exchanges exist on startup; no memory/disk alarms, queue TTLs, or DLX policies for `checkout` and `payments` are configured. [Architecture](../architecture.md), [ADR 0003](../ADR/0003-topology-contracts-and-reliability.md) |

Documentation records these constraints without changing runtime behavior. An under-development status explains incomplete scope but does not turn a known limitation into an enforced guarantee.
