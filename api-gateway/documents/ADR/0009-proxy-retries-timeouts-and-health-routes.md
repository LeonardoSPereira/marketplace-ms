# ADR 0009: Proxy retry/timeout layering and active readiness/liveness routes

- Recorded: 2026-11-18
- Status: Recorded from current implementation; retry safety, deadline cancellation, and readiness status-code questions remain open.
- Scope: Retrospective gateway observation, without historical approval or a downstream audit.
- Supersedes: No-retry and Axios-only proxy deadline observations in [ADR 0005](0005-timeouts-errors-retries.md) and [ADR 0007](0007-proxy-resilience.md); inactive readiness/liveness route and empty retry/timeout scaffold observations in [ADR 0008](0008-health-checks.md). Other observations remain scoped to their records.

## Context

`RetryModule` and `TimeoutModule` now export active `RetryService` and `TimeoutService` providers rather than empty scaffolds. `ProxyModule` imports both modules and layers them inside `ProxyService.proxyRequest`, while the legacy unused `ProxyService.getServiceHealth` helper has been removed. In parallel, `HealthController` now exposes active `GET /health/ready` and `GET /health/live` handlers that delegate to `HealthService`.

## Recorded decision and implementation state

Record the implemented composition:

1. **Nested proxy execution stack**: `ProxyService.proxyRequest` executes four nested steps for a target service:
   - `CircuitBreakerService.executeWithCircuitBreaker` with key `proxy-${serviceName}`, `failureThreshold: 3`, `timeout: 30_000`, and `resetTimeout: 30_000`.
   - `RetryService.executeWithExponentialBackoff` with `maxRetries = 4` (1 initial attempt plus up to 4 retries = 5 total attempts), using `RetryService` defaults of `baseDelay: 1000` ms, `maxDelay: 30000` ms, `backoffMultiplier: 2`, and `jitter: true` (scaling exponential delay by `0.5 + Math.random() * 0.5`).
   - `TimeoutService.executeWithCustomTimeout` racing each attempt against a `setTimeout` rejection at `service.timeout` (10,000 ms).
   - `HttpService.request` with Axios `timeout: service.timeout` (10,000 ms) and response caching for `GET` requests.
2. **Unused timeout-with-retry helper**: `TimeoutService` also defines `executeWithTimeout` (defaulting to `timeout: 5_000` ms, `retries: 3`, `backoffMultiplier: 2`, `maxBackoff: 30_000` ms), which is not called by `ProxyService` or controllers.
3. **Active readiness and liveness endpoints**: `HealthController` exposes `GET /health/ready` (`HealthService.getReadyStatus()`) and `GET /health/live` (`HealthService.getLiveStatus()`). `getReadyStatus()` calls `HealthService.getHealthStatus()`, which runs concurrent downstream probes through `HealthCheckService.checkAllServices()` and sets its aggregate status to `degraded` whenever any service is unhealthy. `getReadyStatus()` therefore returns `status: 'ready'` only when all four services are healthy and `status: 'not_ready'` otherwise. `getLiveStatus()` returns `{ status: 'alive', timestamp, uptime }` without probing dependencies. Both endpoints return HTTP 200 on normal completion.

No controller currently calls `ProxyService.proxyRequest`. Auth routes and health probes continue to use their own `HttpService` calls without `RetryService` or `TimeoutService`.

## Alternatives

Placing retries outside or selectively around idempotent operations, classifying transient versus permanent upstream errors, using `AbortController` or RxJS timeout cancellation to clean up timers, and returning HTTP 503 when `/health/ready` reports `not_ready` are possible alternatives. These are discussion options, not evidence of prior evaluation or approval.

## Consequences and limitations

- **Retry amplification inside the circuit breaker**: Because `RetryService.executeWithExponentialBackoff(..., 4)` runs inside the circuit-breaker operation callback, a single failing `proxyRequest` call performs up to 5 downstream HTTP attempts (plus four backoff sleeps) before recording one circuit failure. Reaching `failureThreshold: 3` to open a `proxy-${serviceName}` circuit requires three exhausted retry cycles (up to 15 failed HTTP attempts).
- **Unconditional retries**: `RetryService` retries every caught rejection regardless of HTTP method (`POST`, `PUT`, `DELETE`, `PATCH` included) or error type (including deterministic 4xx client errors).
- **Timer and operation lifecycle in `TimeoutService`**: `executeWithCustomTimeout` uses `Promise.race` with an uncancelled `setTimeout` handle and does not abort the underlying operation when the timer rejects first (Axios enforces its own `service.timeout` socket deadline). In the unused `executeWithTimeout` helper, the loop bound `attempt < config.retries` executes `config.retries` total attempts while logging `config.retries + 1` and waiting for the backoff delay even after the final failed attempt.
- **Readiness status code and policy**: `GET /health/ready` triggers fresh concurrent probes on every unthrottled call and returns HTTP 200 even when `status` is `'not_ready'`. `HealthService.getHealthStatus()` remains an internal helper behind `getReadyStatus()` and differs from `GET /health/services` when all services fail (`degraded` vs `unhealthy`).

## Open questions

- [DEC-007](../development-status/open-questions.md) and [DEC-008](../development-status/open-questions.md): Which errors and HTTP methods are safe to retry, what idempotency guarantees are required, and how should timeout cancellation and upstream error translation work?
- [DEC-012](../development-status/open-questions.md): Should `GET /health/ready` return a non-200 HTTP status when `not_ready`, and how should readiness probe frequency, caching, and aggregation policy align with `GET /health/services`?
- [DEC-014](../development-status/open-questions.md): How should retries and circuit-breaker failure counts interact when `ProxyService.proxyRequest` is eventually exposed to routes?

## Source evidence

- [Proxy module](../../src/proxy/proxy.module.ts), [Proxy service](../../src/proxy/service/proxy.service.ts)
- [Retry module](../../src/common/retry/retry.module.ts), [Retry service](../../src/common/retry/retry.service.ts), [Retry contracts](../../src/common/retry/retry.interface.ts)
- [Timeout module](../../src/common/timeout/timeout.module.ts), [Timeout service](../../src/common/timeout/timeout.service.ts), [Timeout contracts](../../src/common/timeout/timeout.interface.ts)
- [Health controller](../../src/health/health.controller.ts), [Health service](../../src/health/health.service.ts)
