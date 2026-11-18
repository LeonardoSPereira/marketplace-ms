# Internal proxy resilience

Reviewed: 2026-11-18 (proxy retry and timeout layering updates)

For an introduction to the concepts and state diagrams, read
[Understanding circuit breakers, fallbacks, and caching](../circuit-breakers-and-fallbacks.md).
This guide focuses on the code currently wired into the gateway.

## Registration and scope

[ProxyModule](../../src/proxy/proxy.module.ts) imports the HTTP,
[CircuitBreakerModule](../../src/common/circuit-breaker/circuit-breaker.module.ts),
[FallbackModule](../../src/common/fallback/fallback.module.ts),
[TimeoutModule](../../src/common/timeout/timeout.module.ts), and
[RetryModule](../../src/common/retry/retry.module.ts) dependencies. Nest injects
their exported providers into
[ProxyService](../../src/proxy/service/proxy.service.ts). Only `proxyRequest`
invokes this four-layer stack (circuit breaker, retry, timeout, and fallbacks).
There is no controller caller for that method. Login, registration, and session
validation use direct HTTP calls and bypass this path. Active health probes use
the same breaker registry with separate health keys and a throwing fallback,
without `RetryService`, `TimeoutService`, or product cache/default fallback
data. See [health checks](health-checks.md). Module registration alone does not
protect routes.

## Execution order, retries, timeouts, and circuit state

`ProxyService.proxyRequest` nests four steps from outer to inner:

1. **Circuit breaker** ([CircuitBreakerService.executeWithCircuitBreaker](../../src/common/circuit-breaker/circuit-breaker.service.ts)) with key `proxy-${serviceName}`, `failureThreshold: 3`, `timeout: 30_000`, and `resetTimeout: 30_000`.
2. **Retry** ([RetryService.executeWithExponentialBackoff](../../src/common/retry/retry.service.ts)) with `maxRetries = 4` (1 initial attempt plus up to 4 retries = 5 total attempts per circuit execution).
3. **Timeout** ([TimeoutService.executeWithCustomTimeout](../../src/common/timeout/timeout.service.ts)) racing each attempt against a `setTimeout` rejection after `service.timeout` (10,000 ms).
4. **Outbound HTTP operation** (`HttpService.request` via `firstValueFrom` with Axios `timeout: service.timeout`, copying caller headers, attaching `x-user-*` headers, and caching successful `GET` bodies).

The [breaker service](../../src/common/circuit-breaker/circuit-breaker.service.ts)
keeps a map in memory. The proxy uses `proxy-${serviceName}`, sharing failures
across every method and path for one service. State is local to a process, lost
on restart, and has no automatic removal of circuit keys.

| State       | Current behavior                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `CLOSED`    | Execute the inner retry-wrapped operation once. Success clears the failure count; rejection increments it and runs the fallback.      |
| `OPEN`      | Skip the operation and run the fallback until `nextAttemptTime`.                                                                      |
| `HALF_OPEN` | After the open wait, allow an operation. Success closes the circuit; failure opens it again because the threshold count was retained. |

Proxy options open a circuit after three outer operation failures and permit
another attempt after 30,000 ms. The service defaults are five failures and a
30,000 ms reset wait. Because `RetryService.executeWithExponentialBackoff(..., 4)`
runs inside the circuit-breaker callback, one circuit failure corresponds to an
entire exhausted retry cycle (up to 5 failed HTTP attempts). Reaching
`failureThreshold: 3` therefore requires three exhausted retry cycles (up to 15
failed downstream attempts).

[RetryService](../../src/common/retry/retry.service.ts) defaults to
`maxRetries: 3`, `baseDelay: 1000` ms, `maxDelay: 30000` ms,
`backoffMultiplier: 2`, and `jitter: true` (multiplying `baseDelay * 2 ** attempt`
by `0.5 + Math.random() * 0.5` before capping at `maxDelay`). `executeWithRetry`
returns a `RetryResult<T>` envelope (`success`, `data`, `error`, `attempts`,
`totalTime`) without throwing, while `executeWithExponentialBackoff` unwraps
`result.data` or rethrows `result.error`. Every rejected attempt is retried and
counted regardless of HTTP method (`POST`, `PUT`, `DELETE`, `PATCH` included) or
upstream status code (including deterministic 4xx client errors). A successful
outer operation resets the circuit failure count; concurrent operations can
interleave updates, and half-open attempts have no lock or single-probe limit.

The circuit breaker `timeout` option (proxy: 30,000 ms; default: 60,000 ms)
initializes `nextAttemptTime` while the circuit is closed. It does not impose a
deadline, cancel work, or schedule a timer; opening replaces that timestamp
using `resetTimeout`. Each attempt is instead bounded by both
`TimeoutService.executeWithCustomTimeout` (`Promise.race` at `service.timeout` =
10,000 ms) and Axios `timeout: service.timeout` (10,000 ms). `createTimeoutPromise`
does not clear its `setTimeout` handle when the operation resolves first, and
`Promise.race` rejection does not abort the underlying HTTP call on its own
(Axios's socket timeout handles aborting at the same 10,000 ms threshold).
`TimeoutService` also defines an unused `executeWithTimeout` helper (defaults:
`timeout: 5_000` ms, `retries: 3`, `backoffMultiplier: 2`, `maxBackoff: 30_000`
ms) whose internal `attempt < config.retries` loop runs `config.retries` total
attempts while logging `config.retries + 1` and waiting for the backoff delay
even after the final failed attempt. Fallback success does not call `onSuccess`;
fallback errors propagate to the caller.

Inspection/reset methods remain internal helpers, without HTTP endpoints or
circuit-state fields in health responses. `getCircuitState` exposes a mutable state reference; `getAllCircuits`
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
are unused interfaces. Their retry fields do not configure `RetryService`, and
their cache options do not configure the running providers.

See [ADR 0007](../ADR/0007-proxy-resilience.md),
[ADR 0009](../ADR/0009-proxy-retries-timeouts-and-health-routes.md),
[known limitations](../development-status/limitations.md), and
[open questions](../development-status/open-questions.md). This guide records
observed helpers without approving their exposure or changing runtime behavior.
