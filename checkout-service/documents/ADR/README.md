# Architecture Decision Records

Updated: 2026-11-24.

These records document architecture observed in `checkout-service/`. Retrospective records describe the current implementation and open design questions without claiming prior approval or that listed alternatives were evaluated when the code was written. Recording a limitation or defect does not endorse it, and listing an alternative does not approve its implementation.

| Record | Topic | Status |
| --- | --- | --- |
| [0001](0001-rabbitmq-integration.md) | Direct `amqplib` RabbitMQ integration and topic publishing | Recorded; reliability, consumer, and contract questions remain |
| [0002](0002-persistence-configuration.md) | PostgreSQL and TypeORM persistence configuration | Recorded (unwired); schema migration and lifecycle questions remain |

## Maintaining records

- Store new ADRs in this directory using the next unused four-digit number and a descriptive filename (for example, `0003-order-state-machine.md`).
- Include a recorded ISO 8601 date, explicit status and scope, context, decision and implementation state, alternatives, consequences and limitations, open questions, and source evidence.
- Distinguish a decision's approval status from whether its implementation exists in code.
- Preserve decision history: if a later decision materially changes an earlier one, create a new ADR, mark the earlier record superseded, and link both records.
- Keep this index updated whenever records are added, renamed, resolved, or superseded.

## Related guides

- [Architecture and request flow](../architecture.md)
- [Configuration and startup](../configuration.md)
- [Operations and troubleshooting](../operations.md)
- [RabbitMQ implementation](../implementation/rabbitmq.md)
- [Development status](../development-status/README.md)
- [Messaging ADRs](../../../messaging/documents/ADR/README.md)
