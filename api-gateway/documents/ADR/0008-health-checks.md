# ADR 0008: Dedicated concurrent health probes

- Recorded: 2026-11-09
- Status: Recorded from current implementation; contract questions remain open.
- Scope: Retrospective gateway observation, without historical approval or a downstream audit.
- Supersedes: Health ownership in [ADR 0001](0001-gateway-boundaries.md), sequential probes in [ADR 0002](0002-service-communication.md), active health timeout/error observations in [ADR 0005](0005-timeouts-errors-retries.md), and health bypass of the registry in [ADR 0007](0007-proxy-resilience.md). Other observations remain scoped to their records.

## Context

Health routing has moved from AppController and the ProxyService health helper to
a dedicated feature module and exported probe provider. Previous records describe
the earlier sequential, three-second direct probes; those snapshots remain as
history rather than the current active request flow.

## Recorded decision and implementation state

Record the implemented composition: HealthModule imports HealthCheckModule, which
registers and exports HealthCheckService and imports its HTTP and circuit
providers. Injectable services belong in providers; consumers import the owning
module. The probe provider launches four concurrent requests, each using the
configured 10,000 ms timeout and separate health-prefixed circuit keys. It stores
observations in a process-local cache. The controller exposes gateway process
information, fresh dependency aggregation, and cached individual observations.

HealthService also contains aggregation and readiness/liveness helpers. They are
not called by active HTTP handlers. RetryModule and TimeoutModule are imported
scaffolds with empty services, not implemented resilience mechanisms. See the
[implementation guide](../implementation/health-checks.md) for exact behavior.

## Alternatives

Keeping direct sequential probes, using a maintained health-check integration,
or separating orchestration probes from diagnostic routes are possible options.
These are discussion alternatives, not evidence of earlier evaluation or approval.

## Consequences and limitations

Concurrent probes avoid adding four serial downstream waits. Separate circuit
keys isolate health failures from proxy failure counts, but open health circuits
can report unhealthy without issuing fresh requests. Results remain HTTP 200
on normal completion, cached observations never expire, and successful downstream
bodies are not validated.
Controller aggregation and the internal helper differ when all services fail.
Global throttling also applies to health requests.

## Open questions

[DEC-012](../development-status/open-questions.md) is partially resolved by the
implemented concurrency; readiness/liveness contracts, status codes, cache
freshness, and policy alignment remain open. DEC-014 retains failure classification
and half-open concurrency questions. Recording the code does not approve these
limitations or prescribe future implementation scope.

## Source evidence

- [Root composition](../../src/app.module.ts)
- [Health module](../../src/health/health.module.ts), [controller](../../src/health/health.controller.ts), [service](../../src/health/health.service.ts)
- [Probe module](../../src/common/health-check/health-check.module.ts), [service](../../src/common/health-check/health-check.service.ts), [contracts](../../src/common/health-check/health-check.interface.ts)
- [Circuit provider](../../src/common/circuit-breaker/circuit-breaker.service.ts)
- [Retry scaffold](../../src/common/retry/retry.service.ts), [timeout scaffold](../../src/common/timeout/timeout.service.ts)
