# Health checks and aggregation

Reviewed: 2026-11-18 (active readiness/liveness routes and removal of legacy proxy health helper)

## Registration and active flow

[AppModule](../../src/app.module.ts) imports
[HealthModule](../../src/health/health.module.ts), which registers
[HealthController](../../src/health/health.controller.ts) and
[HealthService](../../src/health/health.service.ts). HealthModule imports
[HealthCheckModule](../../src/common/health-check/health-check.module.ts), which
provides and exports [HealthCheckService](../../src/common/health-check/health-check.service.ts).
The probe module imports HttpModule and CircuitBreakerModule to supply constructor
dependencies. Sibling imports in the root module do not expose those dependencies
to the probe module. Nest shares the exported probe provider and its cache.

The controller returns gateway process information without probing dependencies.
Its all-services handler calls HealthCheckService directly; it does not call
HealthService. Users, products, checkout, and payments probes start concurrently
through map and Promise.allSettled, preserving their configured result order.
Each probe requests the configured service URL plus `/health` through HttpService
and awaits one response with firstValueFrom. Both Axios and the RxJS timeout use
service.timeout, currently 10,000 milliseconds. They do not create two sequential
ten-second waits or a total inbound request deadline. Successful HTTP completion
counts as healthy; the downstream body is neither inspected nor returned.

The controller reports healthy when all entries are healthy, degraded when only
some are healthy, and unhealthy when none are healthy. Counts accompany the
service array. These dependency states do not select a failing HTTP status;
normal handler completion returns HTTP 200. The global throttler can still reject
health requests with HTTP 429. Consult Swagger for the route inventory.

## Circuit state and failures

Probes use the shared circuit registry with separate `health-${serviceName}` keys.
They use its default five-failure threshold and 30,000 ms reset wait. Proxy keys
use `proxy-${serviceName}` and do not share failure counts with health keys.
The breaker timeout option is not an operation deadline. State transitions and
half-open concurrency limitations are described in
[proxy resilience](proxy-resilience.md).

An operation rejection or open circuit invokes a fallback that throws a health
check error. The outer catch stores an unhealthy result and logs the service name.
An open circuit can therefore produce a fast unhealthy result without sending a
new HTTP request. Probe responseTime measures elapsed milliseconds around this
whole operation, including fallback handling, rather than downstream latency alone.
There is no retry. Health probes do not use product cache/default fallbacks.

ServiceHealth contains name, configured URL, status, responseTime, lastCheck, and
an optional error string. Both caught probe failures and all-settled rejections
return the fixed message `Health check failed`, excluding upstream error objects,
stack traces, and request metadata from the health result.

## Cached observations

Each completed probe overwrites its service entry in an in-memory Map. The
single-service controller handler reads this cache only; it never triggers a
probe. An unknown name and a configured service that has not yet been checked
both produce an unknown result with HTTP 200. No startup or scheduled probe
populates the cache. It has no TTL, so lastCheck must be considered when judging
freshness; a process restart clears it. Cache getters expose stored objects by
reference. The health cache is separate from the product fallback cache.

## HealthService and readiness/liveness routes

`HealthController` exposes `GET /health/ready` (`getReady()`) and
`GET /health/live` (`getLive()`), which delegate to `HealthService`:

- `getReadyStatus()` awaits `getHealthStatus()` and returns
  `{ status: 'ready' | 'not_ready', timestamp }`. Normal completion returns HTTP
  200 even when `status` is `'not_ready'`.
- `getLiveStatus()` returns `{ status: 'alive', timestamp, uptime }` with HTTP
  200 without probing downstream services.

`getHealthStatus()` performs fresh concurrent probes via
`HealthCheckService.checkAllServices()` (updating `healthCache`) and builds a
service-name dictionary. `Record<string, Omit<ServiceHealth, 'name'>>` permits
dynamic keys and reuses the probe value shape without duplicating the name. This
is compile-time typing, not validation, serialization, or a Swagger response
schema.

`getHealthStatus()` keeps `gateway.status` healthy and changes its top-level
`status` to `degraded` if any service is unhealthy, even when all four are
unhealthy. That policy differs from `GET /health/services` (`overallStatus` of
`healthy`, `degraded`, or `unhealthy`), and causes `getReadyStatus()` to report
`'not_ready'` whenever at least one dependency fails. The full `getHealthStatus()`
dictionary object is not returned directly by an HTTP route.

The legacy `ProxyService.getServiceHealth` helper has been removed from
[ProxyService](../../src/proxy/service/proxy.service.ts).

## Related records

- [Health architecture ADR](../ADR/0008-health-checks.md),
  [Proxy retries/timeouts and readiness/liveness ADR](../ADR/0009-proxy-retries-timeouts-and-health-routes.md)
- [Architecture](../architecture.md), [configuration](../configuration.md),
  [operations](../operations.md)
- [Health contracts](../../src/common/health-check/health-check.interface.ts)
- [Open decisions](../development-status/open-questions.md): DEC-012 and DEC-014
