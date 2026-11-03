# Architecture and request flow

The gateway is an ESM Nest application using Express. This document describes
this repository; downstream service internals have not been reviewed.

## Composition

| Component                | Current responsibility                                             |
| ------------------------ | ------------------------------------------------------------------ |
| `main.ts`                | Bootstrap, Helmet, CORS, global validation, Swagger, HTTP listener |
| `AppModule`              | Compose modules, register logging middleware and global throttler  |
| `AuthModule`             | Register auth controller/service and HTTP/JWT dependencies         |
| `ProxyModule`            | Export an injectable HTTP helper and downstream health probes      |
| `MiddlewareModule`       | Provide logging middleware; retain a separate throttler config     |
| Downstream configuration | Addresses for users, products, checkout, payments                  |

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

AppController invokes ProxyService health probes with separate three-second
per-service timeouts. Although wrapped in Promise.all, the inner awaits make the
four probes sequential. Each failure becomes an unhealthy entry; the gateway
still reports top-level status ok. Successful probe bodies are not validated.

## Source and related documents

- [Bootstrap](../src/main.ts), [composition](../src/app.module.ts),
  [health controller](../src/app.controller.ts)
- [Gateway boundaries ADR](ADR/0001-gateway-boundaries.md)
- [Communication ADR](ADR/0002-service-communication.md)
- [Auth and Swagger](auth-and-swagger.md), [operations](operations.md)
