# Architecture and request flow

Reviewed: 2026-11-18 (proxy retry/timeout and readiness/liveness updates; unrelated observations retain their prior scope)

The gateway is an ESM Nest application using Express. This document describes
this repository; downstream service internals have not been reviewed.

## Composition

| Component                      | Current responsibility                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `main.ts`                      | Bootstrap, Helmet, CORS, global validation, Swagger, HTTP listener                               |
| `AppModule`                    | Compose modules, register logging middleware and global throttler                                |
| `AuthModule`                   | Register auth controller/service and HTTP/JWT dependencies                                       |
| `ProxyModule`                  | Export an internal HTTP forwarding helper composing circuit breaker, retry, timeout, cache       |
| `HealthModule`                 | Register the active health controller (including readiness/liveness) and `HealthService`         |
| `HealthCheckModule`            | Export concurrent downstream probes and their observation cache                                  |
| `RetryModule`, `TimeoutModule` | Export exponential-backoff retry (`RetryService`) and `Promise.race` deadline (`TimeoutService`) |
| `CircuitBreakerModule`         | Export process-local circuit state for proxy helpers and active health probes                    |
| `FallbackModule`               | Export cache and default/error fallback factories                                                |
| `MiddlewareModule`             | Provide logging middleware; retain a separate throttler config                                   |
| Downstream configuration       | Addresses for users, products, checkout, payments                                                |

Users handles delegated login and registration requests. All four services are
health-probe targets. Products, checkout, and payments have no business-facing
routes here; Swagger tags do not establish implemented functionality. No database,
broker, or persistence layer is registered in the gateway.

## Auth request path

1. HTTP platform middleware handles applicable security/CORS behavior. Registered
   logging middleware observes matched requests and response events.
2. The global custom throttler checks controller requests and can return HTTP 429.
3. The global validation pipe transforms and validates the concrete auth input
   DTO, rejecting invalid or extra fields with HTTP 400.
4. AuthController delegates to injected AuthService.
5. AuthService awaits the users-service response through HttpService and
   firstValueFrom, with a 10-second timeout.
6. The response body is forwarded unchanged. Caught upstream failures become 401.

Nest creates providers through module registration. Importing AuthModule exposes
its exported AuthService; importing ProxyModule exposes ProxyService. Installing
a package or defining a guard class does not activate a request boundary. Only
the custom throttler is registered as a global guard; JWT/session/role guards
are inactive.

## Health path

HealthController uses the exported HealthCheckService for concurrent probes with
10,000 ms per-service timeouts and separate health circuit keys. Gateway process
information, dependency aggregation, cached single-service observations,
readiness, and liveness have distinct handlers. The readiness handler delegates
to `HealthService.getReadyStatus()`, which runs `HealthService.getHealthStatus()`
(invoking `HealthCheckService.checkAllServices()`) and reports `ready` or
`not_ready` with HTTP 200; liveness delegates to `HealthService.getLiveStatus()`
without probing dependencies. `HealthService.getHealthStatus()` is not exposed as
its own route. See [health checks](implementation/health-checks.md) for
registration, cache behavior, error contracts, and policy differences.
AppController currently has no route handlers.

## Internal proxy path

`ProxyModule` injects HTTP, circuit-breaker, fallback, timeout, and retry
services into `ProxyService`. Its `proxyRequest` helper layers four steps:
an outer circuit breaker keyed by `proxy-${serviceName}`, an exponential-backoff
retry loop (`RetryService.executeWithExponentialBackoff` with 4 retries / up to
5 total attempts), a per-attempt `Promise.race` deadline
(`TimeoutService.executeWithCustomTimeout` at `service.timeout`), and the
outbound Axios `HttpService.request` call (also configured with
`timeout: service.timeout`). Product GET failures can return cached data or an
empty listing; other service/method fallbacks throw plain errors. This method has
no controller caller. Auth requests bypass this path. Active health probes use
the same breaker provider through separate health keys, without retries,
`TimeoutService`, or product cache/default fallbacks.

The helper returns a response body or fallback data as `Promise<unknown>`. See [proxy resilience](implementation/proxy-resilience.md) for
state transitions, timeout semantics, cache isolation, and contract limitations.

Source imports now include `@/` aliases configured in TypeScript. The inspected Nest build output rewrites those imports to relative paths; see
[operations](operations.md) for the distinction between compiler mappings and
verified startup.

## Source and related documents

- [Bootstrap](../src/main.ts), [composition](../src/app.module.ts),
  [health controller](../src/health/health.controller.ts)
- [Gateway boundaries ADR](ADR/0001-gateway-boundaries.md)
- [Communication ADR](ADR/0002-service-communication.md)
- [Auth and Swagger](auth-and-swagger.md), [operations](operations.md)
