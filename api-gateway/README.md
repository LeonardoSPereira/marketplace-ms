# Marketplace API Gateway - Under development

A learning project for studying backend development, NestJS, and microservices.
This application is the gateway component of a marketplace microservice project.

**The gateway and the other services that will form this microservices project
are under active development.** A substantial part of the intended system is
still missing and will be added as the project evolves. Current functionality is
an incremental learning baseline, not a complete marketplace or a claim of
production readiness. The [development-status register](documents/development-status/README.md)
tracks missing functionality, known limitations, and open decisions observed in
this gateway; it does not audit the other services' implementation status.

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

## Documentation

- [Development status](documents/development-status/README.md): missing or unwired
  capabilities, implementation limitations, and unresolved architecture questions.
- [ADR index](documents/ADR/README.md): decisions recorded from the current code,
  their alternatives, consequences, and unresolved questions.
- [Architecture](documents/architecture.md),
  [configuration](documents/configuration.md), and
  [operations](documents/operations.md).
- [Auth and Swagger](documents/auth-and-swagger.md),
  [HTTP logging](documents/implementation/logging.md), and
  [throttling](documents/implementation/throttling.md).

Swagger is available at `/api/docs`; keep endpoint details there.

## Documentation checklist

Checked items mean the document exists, not that all architectural questions or
implementation limitations are resolved. ADRs describe the current code rather
than claim historical approval.

- [x] [Architecture overview: service responsibilities and request flow](documents/architecture.md).
- [x] [ADR 0001: gateway responsibilities and downstream boundaries](documents/ADR/0001-gateway-boundaries.md).
- [x] [ADR 0002: synchronous HTTP communication versus messaging](documents/ADR/0002-service-communication.md).
- [x] [ADR 0003: authentication ownership and user-context forwarding](documents/ADR/0003-authentication-context.md).
- [x] [ADR 0004: downstream response contracts and validation](documents/ADR/0004-response-contracts.md).
- [x] [ADR 0005: timeout, retry, and upstream error handling](documents/ADR/0005-timeouts-errors-retries.md).
- [x] [ADR 0006: rate-limit identity, windows, and storage](documents/ADR/0006-rate-limiting.md).
- [x] [Configuration guide: variables, defaults, and startup](documents/configuration.md).
- [x] [Operations guide: health, logs, and troubleshooting](documents/operations.md).
- [x] [Development-status register: gaps, limitations, and open questions](documents/development-status/README.md).
- [ ] Follow-up ADR: enforced authentication and downstream identity trust.
- [ ] Follow-up ADR: corrected rate-limit windows and deployment storage strategy.
- [ ] Follow-up ADR: consistent upstream errors and runtime response validation.

## Current functionalities

- Health checks report the users, products, checkout, and payments services
  individually. The gateway reports `ok` even when a downstream is unhealthy.
- Swagger generates interactive API documentation. The login response uses
  `AuthResponseDto` (`user`, `accessToken`, `sessionToken`, `expiresIn`); the CLI
  plugin supplements DTO metadata. DTOs retain `ApiProperty` metadata and share a
  reusable `Role` enum schema. Response DTOs do not validate or filter output.
- HTTP logging records incoming requests, response status, duration, and response
  errors or timeout events.
- Helmet configures HTTP security headers, and CORS uses a configurable origin
  allowlist.
- Login and registration forward request bodies to the users service with a
  10-second timeout and return its response body. All caught upstream failures,
  including timeouts and registration errors, become HTTP 401 responses.
- A global validation pipe enables DTO transformation and rejects fields without
  validation decorators when validating DTO inputs. Login and registration use
  concrete request DTOs with validation rules.
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
- Registration forwards an unspecified response body, so Swagger documents its
  success status without a response model. Auth validation failures return HTTP
  400; caught upstream failures return HTTP 401, including upstream conflicts.
- Registration documents a role enum but currently validates only that a supplied
  role is a string. Empty string names also pass the current string checks.
- The documented login response is forwarded unchanged; its shape and token
  lifetime units are not checked against the downstream response.
