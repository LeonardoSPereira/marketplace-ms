# Not implemented or not wired

Snapshot: 2026-11-18 (readiness/liveness route and proxy retry/timeout updates).
All entries remain open; GAP-006 is partially resolved as recorded below. These
are gateway observations, not an audit of downstream services or a commitment to
implement every capability. The [development-status index](README.md) explains
scope and maintenance.

| ID      | Current absence                                                                    | Evidence and scope                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GAP-001 | Active authentication and role authorization on controller routes                  | JWT/session/role guards exist, but are not applied; JwtStrategy is not registered. [Auth guide](../auth-and-swagger.md)                                                                                                                                                                                                                                                                                               |
| GAP-002 | HTTP forwarding and aggregation for marketplace business features beyond auth      | ProxyService has an internal forwarding helper, but no controller exposes it. Products, checkout, and payments are health targets, not implemented gateway business routes. [Architecture](../architecture.md)                                                                                                                                                                                                        |
| GAP-003 | Enforced trusted identity/header forwarding                                        | The internal proxy accepts supplied context and copies headers without authentication or allowlisting. No exposed forwarding route currently calls it. [ADR 0003](../ADR/0003-authentication-context.md)                                                                                                                                                                                                              |
| GAP-004 | Defined registration success response model and runtime downstream-response checks | Registration returns unknown; login DTOs document output without validating or filtering it. Whether runtime checks are needed remains an open decision. [ADR 0004](../ADR/0004-response-contracts.md)                                                                                                                                                                                                                |
| GAP-005 | Application-wide startup configuration validation                                  | Required secrets, URLs, and rate-limit counts have no startup schema. [Configuration](../configuration.md)                                                                                                                                                                                                                                                                                                            |
| GAP-006 | Separate dependency readiness/liveness integration                                 | **Partially resolved, 2026-11-18:** HealthController now exposes `GET /health/ready` and `GET /health/live` wired to `HealthService.getReadyStatus()` and `getLiveStatus()`. However, `not_ready` still returns HTTP 200, `getHealthStatus()` is not exposed directly, and no external orchestrator probe contract is configured. [Health checks](../implementation/health-checks.md), [operations](../operations.md) |
| GAP-007 | Request correlation, metrics, tracing, and configured centralized log storage      | Current observability consists of HTTP/application logs and health reporting. [Logging](../implementation/logging.md), [operations](../operations.md)                                                                                                                                                                                                                                                                 |
| GAP-008 | Automated test infrastructure and tests                                            | Intentionally removed for the current learning phase; reintroduction requires an explicitly requested testing phase under repository rules. [AGENTS.md](../../AGENTS.md)                                                                                                                                                                                                                                              |

Active health probes use separate circuit keys; product cache/default fallbacks,
`RetryService`, and `TimeoutService` remain confined to the internal proxy
helper, and auth bypasses both. See [ADR 0008](../ADR/0008-health-checks.md),
[ADR 0009](../ADR/0009-proxy-retries-timeouts-and-health-routes.md), and LIM-013
through LIM-019 in [known limitations](limitations.md). Wider resilience policy
remains DEC-014.

No broker integration, distributed throttle storage, route-level retry policy for
active endpoints, or global inbound request deadline is configured. These are
optional design choices to resolve under [open questions](open-questions.md),
not automatically required features. This register does not request persistence
in the gateway.
