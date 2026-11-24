# Marketplace Checkout Service - Under development

A learning project for studying backend development, NestJS, and microservices.
This application is the checkout microservice of the marketplace project, intended to manage checkout and order workflows and coordinate asynchronously with the future `payments` service via RabbitMQ (see [Messaging ADR 0001](../messaging/documents/ADR/0001-async-messaging-vs-sync-http.md)).

**The checkout service, the API gateway, the messaging layer, and the other services that will form this microservices project are under active development.** A substantial part of the intended system is still missing and will be added as the project evolves. Current functionality is an initial NestJS starter baseline, not a complete checkout service or a claim of production readiness.

## Run locally

```sh
pnpm install
pnpm run dev
```

The service defaults to `http://localhost:3000`; `PORT` overrides the listening port (`process.env.PORT ?? 3000` in [`src/main.ts`](src/main.ts)). Note that the [API Gateway](../api-gateway/README.md) defaults `CHECKOUT_SERVICE_URL` to `http://localhost:8003`, so set `PORT=8003` when running alongside the gateway with default settings.

Use `pnpm run lint` to check code style, `pnpm run lint:fix` to apply automatic fixes, `pnpm run format` to format files with Prettier, and `pnpm run build` to compile the app. Automated test infrastructure has been intentionally removed for now.

## Documentation

- [Repository workflow rules](AGENTS.md): coding, tooling, documentation, and NestJS conventions for this service.
- [Messaging architecture](../messaging/README.md): RabbitMQ broker setup and ADRs covering asynchronous `checkout` <-> `payments` communication.

## Documentation checklist

Checked items mean the document exists, not that all architectural questions or implementation limitations are resolved.

- [ ] Architecture overview: module responsibilities, order lifecycle, and request/message flow.
- [ ] Configuration guide: environment variables, defaults, and startup validation.
- [ ] Operations guide: health checks, logs, and troubleshooting.
- [ ] ADR index and initial service ADRs (persistence, checkout/order state machine, RabbitMQ integration).
- [ ] Development-status register: gaps, limitations, and open questions.

## Current functionalities

- Minimal NestJS 12 (ESM / Express) starter application composed in [`src/app.module.ts`](src/app.module.ts) and bootstrapped in [`src/main.ts`](src/main.ts).
- Exposes a single starter `GET /` endpoint in [`src/app.controller.ts`](src/app.controller.ts) returning `'Hello World!'` via [`src/app.service.ts`](src/app.service.ts).
- Configured with ESLint (`eslint.config.mjs`), Prettier (`.prettierrc.json`), and TypeScript `@/*` -> `./src/*` path mappings (`tsconfig.json`) matching the `api-gateway` workspace conventions.

Current limitations:

- No checkout domain modules, database persistence, DTO validation, health endpoints, Swagger documentation, or RabbitMQ producer/consumer integration are implemented yet.
- Default listening port is `3000` unless `PORT` is set, whereas `api-gateway` defaults `CHECKOUT_SERVICE_URL` to `http://localhost:8003`.
- Automated test infrastructure and tests are intentionally absent for the current learning phase.
