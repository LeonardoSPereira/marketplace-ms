# Auth contracts and Swagger

Reviewed: 2026-11-05

This guide describes the current gateway implementation. Endpoint details and
request examples are available in Swagger at `/api/docs`.

## Request flow and dependency injection

`AppModule` imports `AuthModule`, which registers `AuthController` and `AuthService`.
Nest injects the service into the controller, and supplies `HttpService` and
`JwtService` through the imported HTTP and JWT modules. `AuthService` is exported
for other modules to use; it is not constructed manually.

Logging middleware observes requests and responses. The global custom throttler
runs before controller input pipes. The global `ValidationPipe` transforms auth
request bodies into `LoginDto` or `RegisterDto` instances, validates decorated
fields, and rejects extra properties. Validation failures return HTTP 400 before
an outbound auth call is made; the throttler can reject requests with HTTP 429.

The controller delegates to `AuthService`. The service awaits one HTTP Observable
response through `firstValueFrom`, applies the configured users-service timeout
of 10,000 ms, and returns the downstream body unchanged. Caught upstream failures,
including timeouts and conflicts, become HTTP 401. The gateway does not preserve
upstream error statuses or implement retries for these requests. Auth calls do
not use the internal proxy circuit breaker or cache/default fallbacks; see
[proxy resilience](implementation/proxy-resilience.md).

## Input DTOs and validation

`LoginDto` requires a valid email and a string password of at least six characters.
`RegisterDto` adds string first and last names plus an optional role defaulting to
`Role.USER` when omitted. The name validators allow empty strings. The role is
checked as a string, so values outside the documented enum can currently pass.
`IsOptional` also accepts an explicit `null` role; the default applies when the
field is omitted, rather than replacing `null`.

`ApiProperty` describes fields for Swagger. Runtime validation comes from
`class-validator` decorators and the pipe registered in `src/main.ts`. TypeScript
types and Swagger enums alone do not reject invalid input.

## Response DTOs and Swagger maintenance

The Swagger CLI plugin is enabled in `nest-cli.json`. DTOs keep explicit
`ApiProperty` decorators for examples, nested models, and reusable enum metadata.
The login success decorator explicitly references `AuthResponseDto`; this keeps
the response schema present in the current ESM build without relying on inferred
controller response metadata.

`AuthResponseDto` documents `accessToken`, `sessionToken`, `expiresIn`, and `user`.
`UserResponseDto` describes the nested user's ID, email, first name, last name, and
role. The `Role` schema is shared with registration through `enumName`.

These classes and the HTTP client's response generic provide documentation and
compile-time types. They do not validate downstream data, rename fields, remove
passwords or extra properties, or instantiate response DTOs. The `expiresIn` unit
has not been specified in this gateway; no unit conversion is implemented.
Registration returns `unknown` and documents a success status without a body model.

Keep field metadata in DTO files and reference response classes from success
decorators. Shared validation and rate-limit errors are documented at controller
level; method decorators describe upstream auth failures. When changing a
contract, align DTOs, service/controller types, and Swagger with the downstream
response instead of introducing a mapper solely for documentation.

## Authentication boundaries

Swagger defines bearer and session-token inputs, but those definitions do not
protect routes. JWT strategy, JWT/session/role guards, and auth metadata decorators
are not currently wired into controller requests. The JWT strategy additionally
expects a nested token in `payload.token`. The local verification helper's response
type annotation does not validate the decoded JWT claim structure.

The gateway forwards login tokens rather than signing them. The JWT module's
24-hour signing default does not control downstream-issued token lifetimes.
See the README for the custom throttler's counter and header limitations.
