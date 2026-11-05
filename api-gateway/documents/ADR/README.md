# Architecture Decision Records

These records describe architecture visible in this repository.
Reviewed: 2026-11-05. Recorded dates preserve each snapshot; ADR 0007 documents
the later internal proxy behavior.
They do not claim historical approval or that listed alternatives were evaluated
at the time the code was written. Open questions identify decisions still needed;
recording a limitation does not endorse it.

| Record                                  | Topic                                                | Status                                                        |
| --------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| [0001](0001-gateway-boundaries.md)      | Gateway responsibilities and downstream boundaries   | Recorded; open questions                                      |
| [0002](0002-service-communication.md)   | Synchronous HTTP communication                       | Recorded; open questions                                      |
| [0003](0003-authentication-context.md)  | Authentication ownership and user-context forwarding | Recorded; open questions                                      |
| [0004](0004-response-contracts.md)      | Downstream response contracts and validation         | Recorded; open questions                                      |
| [0005](0005-timeouts-errors-retries.md) | Timeouts, retries, and upstream errors               | Partially superseded by 0007; auth/health observations remain |
| [0006](0006-rate-limiting.md)           | Rate-limit tracking, windows, and storage            | Recorded; open questions                                      |
| [0007](0007-proxy-resilience.md)        | Internal proxy circuits, cache, and fallbacks        | Recorded; open questions                                      |

## Maintaining records

Use the next four-digit number and a descriptive filename for new ADRs. Include
context, the decision and implementation status, alternatives, consequences,
open questions, and links to source evidence. Mark a decision accepted only when
its approval is established. If a later decision replaces one, retain the old
record, mark it superseded, and link both records. Refresh this index with changes.

Implementation guides describe mechanics that can change without replacing an
architectural decision:

- [Architecture and request flow](../architecture.md)
- [Configuration](../configuration.md)
- [Operations](../operations.md)
- [HTTP logging](../implementation/logging.md)
- [Throttling](../implementation/throttling.md)
- [Internal proxy resilience](../implementation/proxy-resilience.md)
- [Auth contracts and Swagger](../auth-and-swagger.md)
