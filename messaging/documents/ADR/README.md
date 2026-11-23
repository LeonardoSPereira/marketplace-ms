# Architecture Decision Records

These records describe the messaging architecture and broker infrastructure visible in this repository.
Updated: 2026-11-23. Recorded dates preserve each snapshot. They do not claim historical approval or that listed alternatives were evaluated before the baseline configuration was created. Open questions identify decisions still needed before producer and consumer microservices are wired; recording a limitation does not endorse it.

| Record | Topic | Status |
| --- | --- | --- |
| [0001](0001-async-messaging-vs-sync-http.md) | Asynchronous messaging versus synchronous HTTP communication | Recorded; event contracts, producer/consumer wiring, and delivery guarantees remain open |
| [0002](0002-rabbitmq-vs-other-brokers.md) | RabbitMQ versus Kafka, SQS, and other messaging systems | Recorded; exchange/queue topology, client library choice, and production hardening remain open |
| [0003](0003-topology-contracts-and-reliability.md) | Broker topology, message contracts, and delivery reliability boundaries | Recorded; topology definitions, shared contract ownership, and failure handling remain open |

## Maintaining records

Use the next four-digit number and a descriptive filename for new ADRs. Include a recorded date, explicit status and scope, context, the decision and implementation state, alternatives, consequences and limitations, open questions, and links to source evidence. Mark a decision accepted only when its approval is established. If a later decision replaces one, retain the old record, mark it superseded, and link both records. Refresh this index when records change.

Related guides and status registers:

- [Architecture and messaging flow](../architecture.md)
- [Understanding asynchronous messaging, AMQP, and RabbitMQ](../async-messaging-concepts.md)
- [Configuration](../configuration.md)
- [Operations and troubleshooting](../operations.md)
- [Development-status register](../development-status/README.md)
