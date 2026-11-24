# Development status

Updated: 2026-11-23 (initial baseline snapshot of the messaging workspace)

The messaging infrastructure and the services that will form this marketplace microservices project are under active development. A substantial part of the intended system is still missing and will be introduced as the project evolves. Current files and documentation describe an incremental learning baseline, not a complete messaging platform or a production-readiness claim.

This register maps gaps, known configuration limitations, and unresolved architectural questions observed in the `messaging/` directory. Other services share the project's development context, but their messaging implementation completeness has not been audited here.

## Registers

| Register | Purpose |
| --- | --- |
| [Not implemented](not-implemented.md) | Capabilities absent or not yet wired in the `messaging/` workspace |
| [Known limitations](limitations.md) | Existing configuration with incomplete guarantees or defects |
| [Open questions](open-questions.md) | Architecture, topology, and contract choices that still need an explicit decision |

Items describe current state, not an approved implementation plan, priority order, or release commitment.

## Maintenance

Use stable IDs: `GAP` for absent functionality, `LIM` for limitations, and `DEC` for open decisions. Link to source-backed guides or ADRs instead of duplicating their details.

When an item changes, update its status and evidence, the relevant guide, and [`README.md`](../../README.md) when behavior changes. Retain resolved entries with a resolution link and date rather than deleting their IDs. Record architectural outcomes in an ADR; use approved plans for implementation scope. A checked README documentation item means a document exists, not that these gaps or limitations are fixed.

See the [ADR index](../ADR/README.md) and [architecture overview](../architecture.md) for the current design.
