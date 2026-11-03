# ADR 0005: Timeouts, retries, and upstream errors

- Recorded: 2026-11-03
- Status: Recorded from current implementation; open questions remain.
- Scope: Retrospective description, not approval of unresolved policy or defects.

## Context

Unbounded downstream waits would hold client requests open. Current integrations
already have finite timeouts, but use different failure mappings.

## Recorded decision and implementation

Record the existing behavior rather than claim a unified policy: auth calls and
the proxy forwarding helper use 10,000 ms service timeouts; health probes use
3,000 ms. There are no configured retries in these call paths.

AuthService maps caught transport failures and rejected upstream responses to
UnauthorizedException (HTTP 401). ProxyService.proxyRequest logs the target and
rethrows the original error. Health probes return unhealthy data with an error
message rather than rejecting the health handler.

## Alternatives

A uniform upstream exception translator could distinguish unavailable services,
timeouts, conflicts, and invalid credentials. Automatic retries could recover
transient failures but would need safe operations or idempotency guarantees for
writes. Those policies are not implemented.

## Consequences and limitations

Auth callers cannot distinguish credential failures from service outages using
status alone. Upstream registration conflicts also become 401. Health returns
its own successful gateway status even when dependencies fail. The internal
proxy helper does not promise sanitized client errors if later exposed.

## Open questions

Define consistent upstream status translation and malformed-response handling.
Choose per-operation retry rules only with explicit safety criteria. Do not use
health's top-level status as dependency readiness.

## Evidence

- [src/config/gateway.config.ts](../../src/config/gateway.config.ts)
- [src/auth/services/auth.service.ts](../../src/auth/services/auth.service.ts)
- [src/proxy/service/proxy.service.ts](../../src/proxy/service/proxy.service.ts)
- [src/app.controller.ts](../../src/app.controller.ts)
