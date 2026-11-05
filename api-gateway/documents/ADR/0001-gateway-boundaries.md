# ADR 0001: Gateway responsibilities and downstream boundaries

- Recorded: 2026-11-03
- Reviewed: 2026-11-05
- Status: Recorded from current implementation; open questions remain.
- Scope: Retrospective description, not approval of unresolved policy or defects.

## Context

The gateway is a learning project composed through Nest modules. It exposes auth
forwarding and health reporting; it has configuration for users, products,
checkout, and payments, but no general HTTP forwarding controller.

## Recorded decision and implementation

Keep HTTP entry points and cross-cutting setup in the gateway. Delegate login and
registration to the users service. Use injectable services for outbound work:
`AuthService` handles auth integration, while `ProxyService` provides health
probes and an internal forwarding helper. No database or persistence provider is
registered in this repository.

This records the boundary visible in code; it does not establish the internal
architecture or business rules of downstream repositories.

## Alternatives

Putting business logic and persistence in the gateway would couple it to service
ownership. Routing clients directly to every service would reduce gateway work
but move integration responsibilities to consumers. Neither alternative is
implemented here.

## Consequences and limitations

Controllers remain small, and dependency injection provides HTTP clients to
services. The gateway is still coupled to downstream paths and response bodies.
`ProxyService.proxyRequest` is a helper, not an exposed routing feature.

## Open questions

Tracked as DEC-001 in the [decision register](../development-status/open-questions.md).

Define which future routes require aggregation or adaptation. Auth outbound
calls currently live directly in AuthService; no separate adapter is present.
Do not infer products, checkout, or payments APIs from Swagger tags alone.

## Evidence

- [src/app.module.ts](../../src/app.module.ts)
- [src/auth/auth.module.ts](../../src/auth/auth.module.ts)
- [src/auth/controllers/auth.controller.ts](../../src/auth/controllers/auth.controller.ts)
- [src/auth/services/auth.service.ts](../../src/auth/services/auth.service.ts)
- [src/proxy/service/proxy.service.ts](../../src/proxy/service/proxy.service.ts)
