# Internal proxy resilience

Reviewed: 2026-11-05

For an introduction to the concepts and state diagrams, read
[Understanding circuit breakers, fallbacks, and caching](../circuit-breakers-and-fallbacks.md).
This guide focuses on the code currently wired into the gateway.

## Registration and scope

[ProxyModule](../../src/proxy/proxy.module.ts) imports the HTTP,
[CircuitBreakerModule](../../src/common/circuit-breaker/circuit-breaker.module.ts),
and [FallbackModule](../../src/common/fallback/fallback.module.ts) dependencies.
Nest injects their exported providers into
[ProxyService](../../src/proxy/service/proxy.service.ts). Only `proxyRequest`
invokes the breaker and fallbacks. There is no controller caller for that method.
Login, registration, session validation, and health probes use direct HTTP calls
and bypass this path. Module registration alone does not protect those routes.

## Execution and circuit state

The [breaker service](../../src/common/circuit-breaker/circuit-breaker.service.ts)
keeps a map in memory. The proxy uses `proxy-${serviceName}`, sharing failures
across every method and path for one service. State is local to a process, lost
on restart, and has no automatic removal of circuit keys.

| State       | Current behavior                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `CLOSED`    | Execute the operation once. Success clears the failure count; rejection increments it and runs the fallback.                          |
| `OPEN`      | Skip the operation and run the fallback until `nextAttemptTime`.                                                                      |
| `HALF_OPEN` | After the open wait, allow an operation. Success closes the circuit; failure opens it again because the threshold count was retained. |

Proxy options open a circuit after three operation failures and permit another
attempt after 30,000 ms. The service defaults are five failures and a 30,000 ms
reset wait. Every rejected operation counts, including upstream client errors;
there is no status-based failure classification or retry. A successful operation
resets the count, so sequential failures accumulate until a success. Concurrent
operations can interleave updates, and half-open attempts have no lock or single
probe limit.

The `timeout` option (proxy: 30,000 ms; default: 60,000 ms) initializes a timestamp
while the circuit is closed. It does not impose a deadline, cancel work, or
schedule a timer. Opening replaces that timestamp using `resetTimeout`. Actual
outbound HTTP calls retain the 10,000 ms service timeout. Fallback success does
not call `onSuccess`; fallback errors propagate to the caller.

Inspection/reset methods are internal helpers, without HTTP endpoints or health
integration. `getCircuitState` exposes a mutable state reference; `getAllCircuits`
copies the map but shares its state objects. They are not read-only snapshots.

## Fallback selection and cache

| Internal operation        | On operation failure or an open circuit                                                |
| ------------------------- | -------------------------------------------------------------------------------------- |
| Products GET              | Return truthy cached data; otherwise `{ products: [], total: 0, page: 1, limit: 10 }`. |
| Other products methods    | Throw a plain service-unavailable `Error`.                                             |
| Users, checkout, payments | Throw a plain service-unavailable `Error`.                                             |

The users fallback selects a special message when the path contains
`/auth/login`. This branch does not affect `AuthService.login`, which calls
`/login` directly and maps caught errors to HTTP 401.

Successful proxy GETs for all services populate the
[cache provider](../../src/common/fallback/cache.fallback.ts), but only products
GET fallbacks read it. Cache keys contain service name and path, omitting headers,
credentials, and user context. The cache therefore cannot safely isolate
personalized results if the helper is later exposed to authenticated callers.

Maximum cached age defaults to 300,000 ms (five minutes), measured from the last
write and checked on access. Entries older than that are deleted when read.
There is no size limit, periodic eviction, persistence, shared replica cache, or
write invalidation. Stored values are retained by reference. Falsy values such as
`false`, `0`, and an empty string select the default instead of being served.
No marker distinguishes live, cached, or default data.

## Contracts and limitations

The helper declares `Promise<unknown>`, matching its return of `response.data`
or fallback data rather than an Axios response. Callers must narrow or validate
the result before using its fields. No code wraps results in the unused
`CircuitBreakerResult` interface or validates their shape. Default listing data
can differ from the requested product path's schema; it does not reflect requested
pagination.

[DefaultFallbackService](../../src/common/fallback/default.fallback.ts) provides
additional constant/empty factories that are not currently called. Its error
factory throws a plain `Error`, without mapping to a Nest HTTP status.
[FallbackStrategy and FallbackOptions](../../src/common/fallback/fallback.interface.ts)
are unused interfaces. Their retry fields enable no retries, and their cache
options do not configure the running providers.

See [ADR 0007](../ADR/0007-proxy-resilience.md),
[known limitations](../development-status/limitations.md), and
[open questions](../development-status/open-questions.md). This guide records
observed helpers without approving their exposure or changing runtime behavior.
