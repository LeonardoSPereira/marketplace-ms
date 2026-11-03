# Marketplace API Gateway - Under development

A learning project for studying backend development, NestJS, and microservices.
This application is the gateway component of a marketplace microservice project.

## Run locally

```sh
pnpm install
pnpm run dev
```

The gateway defaults to `http://localhost:8000`; `PORT` overrides the listening
port. See [`.env.example`](.env.example) for environment variable names. Downstream
URLs are read when their configuration module is imported, so variables exported
before startup are available to those reads.

Set `CORS_ORIGIN` to comma-separated origins without spaces, such as
`http://localhost:3000,http://localhost:5173`. Leaving it unset allows any origin;
an empty value does not have the same behavior.

`JWT_SECRET` configures local JWT verification in `AuthService`; it has no startup
validation. The configured 24-hour signing lifetime does not change tokens returned
by the users service, and the gateway currently does not sign tokens.

Rate limits default to `10` requests per second, `100` per minute, and `1000` per
15 minutes. `RATE_LIMIT_SHORT`, `RATE_LIMIT_MEDIUM`, and `RATE_LIMIT_LONG` override
the corresponding counts. These are configured windows; see the limitations below
before relying on them as independent quotas.

Use `pnpm run lint` to check code style and `pnpm run build` to compile the app.

## Documents to write

ADRs (Architecture Decision Records) capture a decision, its context, alternatives,
and consequences.

- [ ] Architecture overview: service responsibilities and request flow.
- [ ] ADR: gateway responsibilities and boundaries with downstream services.
- [ ] ADR: synchronous HTTP communication versus asynchronous messaging.
- [ ] ADR: authentication ownership and trusted user-context forwarding.
- [ ] ADR: timeout, retry, and upstream error-handling policies.
- [ ] ADR: rate-limit tracker identity, named windows, and shared counter storage.
- [ ] Configuration guide: environment variables, defaults, and startup behavior.
- [ ] Operations guide: health checks, logs, and troubleshooting service failures.

## Current functionalities

- Health checks report the users, products, checkout, and payments services
  individually. The gateway reports `ok` even when a downstream is unhealthy.
- Swagger generates interactive API documentation.
- HTTP logging records incoming requests, response status, duration, and response
  errors or timeout events.
- Helmet configures HTTP security headers, and CORS uses a configurable origin
  allowlist.
- Login and registration forward request bodies to the users service with a
  10-second timeout and return its response body. All caught upstream failures,
  including timeouts and registration errors, become HTTP 401 responses.
- A global validation pipe enables DTO transformation and rejects fields without
  validation decorators when validating DTO inputs. Auth inputs currently use
  inline types or `any`, so they have no runtime DTO validation.
- A global custom throttler tracks controller requests by handler, IP, and
  User-Agent using in-memory storage. Login configures a short-window override of
  5 requests per minute; registration configures a medium-window override of 3
  requests per minute. Exceeding the custom guard's hit limit returns HTTP 429.
- An injectable proxy service supports outbound HTTP requests with service-specific
  timeouts and optional user-context headers. No HTTP forwarding routes are wired
  to this method.
- Environment configuration is loaded through Nest's `ConfigModule`. Downstream
  defaults use localhost ports `8001` through `8004`.

Current limitations:

- JWT strategy, authentication/session/role guards, and user/role/public decorators
  exist as helpers but are not registered or applied to routes. Current routes do
  not require authentication. Swagger's bearer scheme only documents token input.
- The JWT strategy expects a nested token in `payload.token` and returns user
  fields from the outer payload; it is not wired into Passport's provider graph.
- The custom throttler falls back to a shared `default` counter name across named
  windows for each handler and tracker. Each window can increment that counter,
  so configured quotas are not enforced independently. It passes a fixed 1 ms
  block duration and checks hit counts instead of the storage's blocked flag.
  Rate-limit headers overwrite one another and report full window durations,
  rather than remaining reset/retry times. Counters are not shared across gateway
  processes. `MiddlewareModule` also retains a separate unnamed configuration.
- Registration's Swagger metadata lists HTTP 400, but caught upstream failures
  currently return HTTP 401. Auth inputs have no concrete DTO body schemas.
