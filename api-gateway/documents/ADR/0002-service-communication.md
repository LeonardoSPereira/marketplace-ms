# ADR 0002: Synchronous HTTP communication

- Recorded: 2026-11-03
- Status: Recorded from current implementation; open questions remain.
- Scope: Retrospective description, not approval of unresolved policy or defects.

## Context

Auth handlers need a downstream response before answering clients. Health
reporting probes each configured service. The repository has no broker transport,
event producer, consumer, or asynchronous messaging configuration.

## Recorded decision and implementation

Use the installed Nest Axios integration for current downstream communication.
`HttpService` returns Observables; `firstValueFrom` lets services await one HTTP
response. Auth requests and health probes use finite per-call timeouts.

Synchronous means the HTTP response depends on downstream completion; awaiting
network I/O does not itself block the Node.js event loop.

## Alternatives

Messaging could decouple event producers from consumers but would require event
contracts, delivery handling, and infrastructure. Direct fetch or another client
would introduce a second HTTP integration. These are alternatives for future
work, not evidence of an earlier evaluation.

## Consequences and limitations

Current request flow is easy to follow but inherits downstream latency and
availability. Health checks are sequential because each array entry is awaited
before Promise.all receives it. Their latency can accumulate across services.

## Open questions

Choose asynchronous messaging only when a concrete workflow needs it. Decide
whether health probes should run concurrently; no concurrency refactor is part
of this record.

## Evidence

- [src/auth/services/auth.service.ts](../../src/auth/services/auth.service.ts)
- [src/proxy/service/proxy.service.ts](../../src/proxy/service/proxy.service.ts)
- [src/app.controller.ts](../../src/app.controller.ts)
- [src/proxy/proxy.module.ts](../../src/proxy/proxy.module.ts)
