# ADR 0003: Authentication ownership and user-context forwarding

- Recorded: 2026-11-03
- Status: Recorded from current implementation; open questions remain.
- Scope: Retrospective description, not approval of unresolved policy or defects.

## Context

Login and registration are delegated to the users service. JWT verification,
session validation, and role authorization helpers exist, but authentication is
not enforced on current controller routes.

## Recorded decision and implementation

Record users-service delegation as the current credential/token boundary. The
gateway returns downstream login data and does not sign tokens. AuthModule
registers AuthService and imports JWT/Passport support, but does not register
JwtStrategy or apply the JWT/session/role guards.

Trusted user-context forwarding remains unresolved. The internal proxy helper
accepts caller-provided user information and copies supplied headers, adding
`x-user-id`, `x-user-email`, and `x-user-role`. It neither authenticates that
information nor filters headers, and no HTTP route invokes this helper.

## Alternatives

Local JWT verification could authenticate requests without a session lookup;
remote session checks could consult current session state. Both have helper
code, but neither is an active route policy. Signed internal identity context or
restricted service-to-service transport would require an explicit trust design.

## Consequences and limitations

Swagger bearer/session schemes document inputs only. The JWT strategy expects
another token in payload.token and returns fields from the outer payload. The
JWT guard and session guard produce different identity field names (userId and
id). Their types do not establish a common trusted forwarding contract.

## Open questions

Choose guard registration, public-route policy, identity shape, role ownership,
header allowlisting, and downstream trust enforcement before exposing forwarding.
Registration currently permits arbitrary string roles; the documented enum is
not an authorization boundary. JWT_SECRET has no startup validation.

## Evidence

- [src/auth/auth.module.ts](../../src/auth/auth.module.ts)
- [src/auth/services/auth.service.ts](../../src/auth/services/auth.service.ts)
- [src/auth/strategies/jwt.strategy.ts](../../src/auth/strategies/jwt.strategy.ts)
- [src/guards/auth.guard.ts](../../src/guards/auth.guard.ts)
- [src/guards/session.guard.ts](../../src/guards/session.guard.ts)
- [src/guards/role.guard.ts](../../src/guards/role.guard.ts)
- [src/auth/dtos/register.dto.ts](../../src/auth/dtos/register.dto.ts)
- [src/proxy/service/proxy.service.ts](../../src/proxy/service/proxy.service.ts)
