# Operations and troubleshooting

## Start and inspect

From the gateway directory, use pnpm install and pnpm run dev for local work.
The default address is http://localhost:8000 and Swagger is at /api/docs. See the
[configuration guide](configuration.md) before setting environment values. Run
pnpm run lint for style checks and pnpm run build for compilation; these do not
prove downstream availability. No automated test suite is currently configured.

## Health interpretation

The health handler probes users, products, checkout, and payments with a
three-second timeout each. The probes run sequentially due to inner awaits, so
four timeout failures can contribute roughly 12 seconds of downstream wait.
This is not a configured total request deadline.

Each dependency reports healthy with its response body, or unhealthy with an
error message. Successful response bodies are not inspected for a service-level
failure indicator. Top-level ok means the gateway answered; it is not dependency
readiness and does not produce a failing HTTP status for downstream outages.
Health requests can themselves be rate-limited. No separate readiness/liveness
integration or orchestration probe configuration is provided here.

## Common symptoms

| Symptom                                    | Check in this repository                                                                                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Auth HTTP 400                              | DTO validation: email, password length/type, required name strings, extra fields                                                    |
| Auth HTTP 401                              | Invalid credentials or any caught upstream failure; check users connectivity, configured URL, downstream path and service-side logs |
| Registration conflict appears as 401       | AuthService maps all caught upstream failures to UnauthorizedException                                                              |
| HTTP 429 sooner than configured count      | Shared counter across windows in the custom guard; inspect tracker and overrides                                                    |
| Unhealthy dependency but gateway ok        | Expected health aggregation behavior; inspect each service entry                                                                    |
| Wrong downstream target after editing .env | URLs are captured at import time; export them before startup and restart                                                            |
| Browser CORS rejection                     | Exact origin allowlist, commas without spaces, empty CORS_ORIGIN, allowed headers                                                   |
| Missing Swagger response fields            | Check response DTO metadata and explicit success-decorator type; rebuild/restart after changes                                      |

Auth failures do not preserve upstream response details. Existing HTTP logs alone
cannot distinguish bad credentials from a users-service timeout. Do not add
credentials or tokens to URLs when investigating; URL paths and query strings
are logged without redaction. See [HTTP logging](implementation/logging.md) for
fields, events, and limits, and [throttling](implementation/throttling.md) for
counter and header behavior.

## Current observability limits

There is no configured metrics endpoint, distributed tracing, request correlation,
central log storage, or global inbound timeout. Response timeout listeners only
observe events. JWT/session/role guards remain inactive despite Swagger security
inputs. The general proxy helper is not exposed through an HTTP forwarding route.

Evidence: [health controller](../src/app.controller.ts),
[health/proxy service](../src/proxy/service/proxy.service.ts),
[auth service](../src/auth/services/auth.service.ts), [bootstrap](../src/main.ts).
