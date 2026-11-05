# Development status

Updated: 2026-11-05

The gateway and the other services that will form this marketplace microservices
project are under active development. A substantial part of the intended system
is still missing and will be introduced as the project evolves. Current code and
documentation describe an incremental learning project, not a complete marketplace
or a production-readiness claim.

This register maps gaps observed in the gateway repository and unresolved topics
from its ADRs. Other services share the project's development context, but their
implementation completeness has not been audited here. A missing gateway route
does not establish that the corresponding downstream feature is missing.

## Registers

| Register                              | Purpose                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------- |
| [Not implemented](not-implemented.md) | Capabilities absent or not connected to the current gateway request flow  |
| [Known limitations](limitations.md)   | Existing functionality with incomplete guarantees or constrained behavior |
| [Open questions](open-questions.md)   | Architecture and contract choices that still need an explicit decision    |

Items describe current state, not an approved implementation plan, priority order,
or release commitment. Some absences may remain intentional: messaging, shared
counter storage, and response validation depend on requirements yet to be chosen.
Database ownership belongs to downstream services; its absence in this gateway
is not itself a missing gateway feature.

## Maintenance

Use stable IDs: GAP for absent functionality, LIM for limitations, and DEC for
open decisions. Link to source-backed guides or ADRs instead of duplicating their
implementation details. Categories may overlap: missing guard registration and
an unresolved authentication policy describe different aspects of the same work.

When an item changes, update its status and evidence, the relevant implementation
guide, and README when behavior changes. Retain resolved entries with a resolution
link and date rather than silently deleting their IDs. Record architectural
outcomes in an ADR; use approved plans for implementation scope. A checked
README documentation item means a document exists, not that these gaps are fixed.

See the [ADR index](../ADR/README.md) and [architecture overview](../architecture.md)
for the current design and request flow.
