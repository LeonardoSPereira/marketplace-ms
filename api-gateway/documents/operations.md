# Operations and troubleshooting

Reviewed: 2026-11-09 (health-related sections; unrelated observations retain their prior scope)

## Start and inspect

From the gateway directory, use pnpm install and pnpm run dev for local work.
The default address is http://localhost:8000 and Swagger is at /api/docs. See the
[configuration guide](configuration.md) before setting environment values. Run
pnpm run lint for style checks and pnpm run build for compilation; these do not
prove downstream availability. No automated test suite is currently configured.

## Health interpretation

Gateway health reports process information without contacting dependencies.
The dependency handler launches concurrent probes of users, products, checkout,
and payments, using 10,000 ms timeouts and separate health circuit keys. Its
aggregate is healthy for all healthy results, degraded for mixed results, and
unhealthy when none are healthy. Normal completion still returns HTTP 200;
HTTP status alone is not dependency readiness. Health handlers are throttled.

Individual service lookups read cached observations without probing. An unknown
result can mean an invalid name or no prior probe. Cached entries never expire;
inspect lastCheck and run the all-services check for fresh observations. An open
health circuit may skip the outbound request and produce an unhealthy result
quickly. No scheduled checks or active readiness/liveness routes are wired.

See [health checks](implementation/health-checks.md) for cache, failure messages,
internal helper differences, and the legacy unused three-second probe helper.

## Build and startup limitations

The source now uses `@/` imports with a `paths` entry in
[tsconfig.json](../tsconfig.json). The inspected Nest build output in dist/main.js uses relative imports, and
`pnpm run start` successfully initialized and listened during the 2026-11-09
module-fix verification. TypeScript mappings alone do not establish runtime
resolution; inspect emitted imports if an alternate build path reports unresolved
aliases. The separate `pnpm run start:prod` command was not exercised in that check.

The internal proxy helper returns body or fallback data as `Promise<unknown>`.
Callers must narrow or validate this value; the annotation does not verify a
downstream schema. Keep compiler diagnostics separate from runtime observations;
formatting and lint checks cannot verify response bodies.

## Common symptoms

| Symptom                                    | Check in this repository                                                                                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Auth HTTP 400                              | DTO validation: email, password length/type, required name strings, extra fields                                                    |
| Auth HTTP 401                              | Invalid credentials or any caught upstream failure; check users connectivity, configured URL, downstream path and service-side logs |
| Registration conflict appears as 401       | AuthService maps all caught upstream failures to UnauthorizedException                                                              |
| HTTP 429 sooner than configured count      | Shared counter across windows in the custom guard; inspect tracker and overrides                                                    |
| Unhealthy dependency but gateway ok        | Gateway process health does not probe dependencies; inspect the dependency aggregation body                                         |
| Wrong downstream target after editing .env | URLs are captured at import time; export them before startup and restart                                                            |
| Browser CORS rejection                     | Exact origin allowlist, commas without spaces, empty CORS_ORIGIN, allowed headers                                                   |
| Missing Swagger response fields            | Check response DTO metadata and explicit success-decorator type; rebuild/restart after changes                                      |

Auth failures do not preserve upstream response details. Existing HTTP logs alone
cannot distinguish bad credentials from a users-service timeout. Do not add
credentials or tokens to URLs when investigating; URL paths and query strings
are logged without redaction. See [HTTP logging](implementation/logging.md) for
fields, events, and limits, and [throttling](implementation/throttling.md) for
counter and header behavior.

## Internal resilience diagnostics

Login, registration, and session helpers bypass the circuit breaker. Active
health probes use health-prefixed circuits, separate from proxy circuits, and
do not use product fallback data.
add no retries or deadlines despite their modules being imported. There
is no HTTP circuit-inspection/reset endpoint. The circuit provider's inspection
methods are internal helpers, and `/health` does not report circuit/cache state.
See [proxy resilience](implementation/proxy-resilience.md) for fixed values and
failure behavior before interpreting internal helper logs as route protection.

## Current observability limits

There is no configured metrics endpoint, distributed tracing, request correlation,
central log storage, or global inbound timeout. Response timeout listeners only
observe events. JWT/session/role guards remain inactive despite Swagger security
inputs. The general proxy helper is not exposed through an HTTP forwarding route.

Evidence: [health controller](../src/health/health.controller.ts),
[active probes](../src/common/health-check/health-check.service.ts),
[health/proxy service](../src/proxy/service/proxy.service.ts),
[auth service](../src/auth/services/auth.service.ts), [bootstrap](../src/main.ts).
