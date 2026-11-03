# ADR 0006: Rate-limit tracking, windows, and storage

- Recorded: 2026-11-03
- Status: Recorded from current implementation; open questions remain.
- Scope: Retrospective description, not approval of unresolved policy or defects.

## Context

AppModule defines named request windows and registers CustomThrottlerGuard as
APP_GUARD. The guard uses IP plus User-Agent and the default in-memory storage.
This is an active controller guard, not only configuration.

## Recorded decision and implementation

Record the current per-process limiter and its custom tracker. AppModule
configures short, medium, and long windows with environment-overridable counts.
Auth handlers override one named window each. MiddlewareModule retains a
separate unnamed throttler configuration; this does not register another guard.

The implementation does not correctly isolate named windows. Its lookup of a
single throttle metadata key falls back to default for current decorators, so
window checks share a counter for a handler/tracker. This is an implementation
limitation, not an endorsed independent-quota design.

## Alternatives

The standard guard with only a tracker override would retain more built-in
window behavior. An IP-only or authenticated-user tracker has different fairness
and abuse tradeoffs. Shared storage would support multiple gateway processes
but adds an operational dependency. These remain alternatives.

## Consequences and limitations

User-Agent is client-controlled; changing it changes the tracker. Multiple
windows can increment the same counter. The override passes a fixed 1 ms block
duration and checks totalHits instead of the storage blocked flag. Headers are
overwritten across windows and report full TTL seconds instead of remaining
times. Restarts lose counters and replicas do not share them.

## Open questions

Resolve window key isolation, block behavior, header semantics, duplicate
configuration, reverse-proxy identity, and storage requirements before treating
the configured numbers as reliable independent quotas. See the implementation
guide for exact values and registration points.

## Evidence

- [src/app.module.ts](../../src/app.module.ts)
- [src/guards/throttler.guard.ts](../../src/guards/throttler.guard.ts)
- [src/auth/controllers/auth.controller.ts](../../src/auth/controllers/auth.controller.ts)
- [src/middleware/middleware.module.ts](../../src/middleware/middleware.module.ts)
