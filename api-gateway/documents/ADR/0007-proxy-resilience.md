# ADR 0007: Internal proxy circuit breaker and fallbacks

- Recorded: 2026-11-05
- Status: Recorded from current implementation; open questions remain.
- Scope: Retrospective record of internal helper behavior, without historical approval.
- Supersedes: The proxy error-propagation description in [ADR 0005](0005-timeouts-errors-retries.md). Its auth, health, timeout, and retry observations remain applicable.

## Context

The internal proxy helper now wraps operations in an injectable circuit breaker
and selects per-service fallbacks. Earlier documentation described logging and
rethrowing the original proxy error. No controller currently calls this helper;
auth and health requests continue through separate HTTP paths.

## Recorded decision and implementation

Record the code now present: `ProxyModule` imports circuit and fallback modules,
which export providers for constructor injection into `ProxyService`. Circuits
share one key per downstream service. Proxy settings use three failures and a
30,000 ms reset delay. Product GET failures use a process-local cache or a fixed
empty listing. Other operations use plain-error fallbacks. The circuit and cache
are local to each gateway process.

Only the Axios service timeout enforces the outbound wait. The breaker `timeout`
field does not enforce a deadline. Neither the helper nor fallback interfaces
implement retries. See [the implementation guide](../implementation/proxy-resilience.md)
for state transitions and cache mechanics.

This records implementation presence; it does not approve a public fallback
contract, cache trust boundary, or use on login, registration, or health routes.

## Alternatives

Direct error propagation, a maintained circuit-breaker library, shared state, and
operation-specific fallback policies are possible alternatives. Disabling cache
fallback for personalized responses or including verified identity in keys would
change isolation behavior. These are discussion options, not previously evaluated
or approved choices.

## Consequences and limitations

The helper can avoid outbound calls while its circuit is open and return data
for failed product reads. However, cache keys omit identity and headers, default
data has a fixed listing schema, and results contain no fallback provenance.
Every operation rejection counts toward the service-wide threshold, including
client errors. Half-open calls are not limited to a single probe. Cache entries
have no size bound or scheduled eviction.

The initial snapshot had an Axios response annotation that differed from returned
body/fallback values. Resolved on 2026-11-05: [ProxyService](../../src/proxy/service/proxy.service.ts)
now declares `Promise<unknown>`, matching its body/fallback return behavior. This
type correction does not introduce response validation or fallback provenance.
Plain fallback errors do not define a sanitized HTTP translation contract. No
HTTP routes, health integration, or operational reset endpoint expose this state.

## Open questions

[DEC-014](../development-status/open-questions.md) tracks which operations need
resilience, failure classification, cache isolation, response/provenance shapes,
and half-open concurrency policy. Existing error translation and retry questions
remain in DEC-007 and DEC-008 in the same register. Implementation presence does
not resolve those decisions.

## Evidence

- [Proxy module](../../src/proxy/proxy.module.ts)
- [Proxy service](../../src/proxy/service/proxy.service.ts)
- [Circuit service](../../src/common/circuit-breaker/circuit-breaker.service.ts)
- [Circuit contracts](../../src/common/circuit-breaker/circuit-breaker.interface.ts)
- [Cache fallback](../../src/common/fallback/cache.fallback.ts)
- [Default fallbacks](../../src/common/fallback/default.fallback.ts)
- [Fallback contracts](../../src/common/fallback/fallback.interface.ts)
