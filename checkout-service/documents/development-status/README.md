# Development status

Updated: 2026-11-24 (initial checkout-service baseline).

The checkout service, the API gateway, the messaging layer, and the other services that will form this marketplace microservices project are under active development. A substantial part of the intended system is still missing and will arrive as the project evolves. Current code and documentation describe an incremental learning project, not a complete checkout service or a claim of production readiness.

This register tracks verified observations in `checkout-service/` and unresolved questions from its ADRs. Other services share the project's development context, but their implementation completeness has not been audited here; a missing feature in `checkout-service` does not establish the state of any other service.

## Registers

| Register | Purpose |
| --- | --- |
| [Not implemented](not-implemented.md) | Capabilities absent or not wired into the active `checkout-service` application |
| [Known limitations](limitations.md) | Existing code and configuration with incomplete guarantees or constrained behavior |
| [Open questions](open-questions.md) | Architecture, persistence, messaging, and contract choices still needing a decision |

Entries describe current observed state, not an approved implementation plan, priority order, or release commitment. Approved implementation scope belongs in plans under `documents/plans/` and architectural outcomes belong in ADRs.

## Maintenance

- Use stable, unique IDs with the next unused number in each category: `GAP-001`, `LIM-001`, and `DEC-001`. Do not renumber existing entries or reuse retired IDs.
- Link to source-backed guides or ADRs rather than duplicating implementation details. Categories may overlap and can cross-link each other.
- Keep an explicit status for entries (individually or via the register's shared status statement). When resolving an entry, keep its ID and description, record the ISO 8601 resolution date and source evidence, and update the shared status statement if not all entries remain open.
- A checked item in the root [`README.md`](../../README.md) documentation checklist means the document exists, not that the tracked gaps or open questions are resolved.

See the [ADR index](../ADR/README.md) and [architecture overview](../architecture.md) for current structure and active flow.
