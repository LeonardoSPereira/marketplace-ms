# Throttling implementation

[AppModule](../../src/app.module.ts) registers CustomThrottlerGuard through
APP_GUARD, enabling checks for controller requests, including health handlers.
[The custom guard](../../src/guards/throttler.guard.ts) extends the installed
ThrottlerGuard and overrides tracker creation and request handling. No current
handler skips throttling.

## Configured windows

| Name   | TTL in milliseconds | Default request count | Environment override |
| ------ | ------------------- | --------------------- | -------------------- |
| short  | 1,000               | 10                    | RATE_LIMIT_SHORT     |
| medium | 60,000              | 100                   | RATE_LIMIT_MEDIUM    |
| long   | 900,000             | 1000                  | RATE_LIMIT_LONG      |

The auth login handler overrides short to 5 per 60,000 ms; registration overrides
medium to 3 per 60,000 ms. Other configured windows still participate.
MiddlewareModule also imports a separate unnamed 100-per-60,000-ms configuration;
this is not a second global guard registration or an additional proven quota.

## Actual counter behavior

The tracker string combines req.ip and the User-Agent header. The inherited key
generator includes controller/handler identity, so this is not a single global
quota per IP. User-Agent is supplied by the client and is not authenticated.
There is no explicit Express trust-proxy setup in bootstrap; do not assume the
tracker represents an original client's forwarded IP behind a reverse proxy.

The inherited guard resolves window limits/TTLs before calling handleRequest.
The override looks for a single throttle metadata object rather than using the
provided named throttler. Current decorators do not populate that key, so the
name becomes default and the handler/tracker counter is shared across windows.
A request can increment it multiple times. Configured counts therefore do not
represent independent effective quotas, and no exact requests-per-window
capacity should be inferred from the table.

The override passes 1 as the storage block duration (milliseconds), ignoring the
resolved duration. It rejects when totalHits exceeds the current limit instead
of using the returned isBlocked flag. Default storage is in memory: processes
do not share counters, and restarts discard state.

## Response behavior

A rejected check sets Retry-After to the rounded full TTL in seconds and throws
ThrottlerException (HTTP 429). Successful checks set X-RateLimit-Limit,
X-RateLimit-Remaining, and X-RateLimit-Reset. All windows reuse those header names,
so later checks overwrite earlier ones. Reset and retry values use full TTL,
not actual remaining expiry/block times.

These mechanics are limitations to resolve, not guarantees about abuse
protection or a recommended distributed rate-limit design. See
[ADR 0006](../ADR/0006-rate-limiting.md) for alternatives and open questions.
