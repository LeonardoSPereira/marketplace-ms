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

Use `pnpm run lint` to check code style and `pnpm run build` to compile the app.

## Documents to write

ADRs (Architecture Decision Records) capture a decision, its context, alternatives,
and consequences.

- [ ] Architecture overview: service responsibilities and request flow.
- [ ] ADR: gateway responsibilities and boundaries with downstream services.
- [ ] ADR: synchronous HTTP communication versus asynchronous messaging.
- [ ] ADR: authentication ownership and trusted user-context forwarding.
- [ ] ADR: timeout, retry, and upstream error-handling policies.
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
- A global validation pipe enables DTO transformation and rejects fields without
  validation decorators when validating DTO inputs. No request DTOs exist yet.
- An injectable proxy service supports outbound HTTP requests with service-specific
  timeouts and optional user-context headers. No HTTP forwarding routes are wired
  to this method.
- Environment configuration is loaded through Nest's `ConfigModule`. Downstream
  defaults use localhost ports `8001` through `8004`.

Rate-limit windows are configured, but limits are not enforced because no
`ThrottlerGuard` is registered. Swagger's bearer-token scheme documents a token
input; authentication is not implemented.
