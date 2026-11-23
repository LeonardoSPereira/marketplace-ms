# ADR 0004: Downstream response contracts and validation

- Recorded: 2026-11-03
- Reviewed: 2026-11-05
- Status: Recorded from current implementation; open questions remain.
- Scope: Retrospective description, not approval of unresolved policy or defects.

## Context

Swagger needs runtime model classes, while the gateway currently returns auth
response bodies without mapping or response validation.

## Recorded decision and implementation

Use AuthResponseDto and its nested UserResponseDto to document login output.
Keep ApiProperty metadata in DTOs and explicitly reference the response class in
the controller success decorator. The enabled Swagger CLI plugin supplements
metadata. Login's documented fields are user, accessToken, sessionToken, and
expiresIn. Registration remains Promise<unknown> without a success body schema.

The current response policy is pass-through: no DTO instantiation, field
filtering, or runtime output validation. Input DTO validation is separately
activated by the global ValidationPipe.

## Alternatives

Inline controller schemas duplicate field metadata. Interfaces alone do not
provide runtime Swagger models. Runtime response parsing could detect contract
drift, and serialization could filter fields; neither is implemented.

## Consequences and limitations

DTOs centralize documentation and compile-time typing without changing payloads.
They cannot guarantee that downstream data matches the schema or exclude extra
sensitive fields. The expiresIn unit is unspecified. The local JWT verification
helper also uses AuthResponseDto as a return annotation without validating claims.

## Open questions

Tracked as DEC-006 in the [decision register](../development-status/open-questions.md).

Confirm the downstream login contract and token lifetime units, define a
registration response, and decide where response validation belongs. Do not
interpret TypeScript generics as runtime checks.

## Evidence

- [src/auth/dtos/auth-response.dto.ts](../../src/auth/dtos/auth-response.dto.ts)
- [src/auth/dtos/user-response.dto.ts](../../src/auth/dtos/user-response.dto.ts)
- [src/auth/controllers/auth.controller.ts](../../src/auth/controllers/auth.controller.ts)
- [src/auth/services/auth.service.ts](../../src/auth/services/auth.service.ts)
- [src/main.ts](../../src/main.ts)
- [nest-cli.json](../../nest-cli.json)
