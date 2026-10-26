# Repository workflow rules

## Communication and documentation

- Use English in chat and repository documentation unless the user explicitly requests another language. When a prompt mixes languages, ask which language to use.
- Use Context7 for current library, framework, SDK, API, CLI, and cloud-service documentation. Resolve the library ID first, then query the selected library with the specific question. Prefer documentation matching the installed version. This is not required for general programming concepts, business-logic debugging, refactoring, or code review without library-specific questions.
- Treat `package.json`, `eslint.config.mjs`, `.prettierrc.json`, `tsconfig.json` as the source of truth for installed tools, commands, formatting, and compiler behavior.

## Before implementation

- Read this `AGENTS.md` before starting a new implementation.
- Save plans created in plan mode and approved by the user in `documents/plans/` before implementation begins. Create that directory when needed.
- Do not create a plan for every chat interaction. Update an existing plan when its approved scope changes; create a separate plan for unrelated work.
- Every saved plan must include an ISO 8601 creation timestamp and an explicit implementation status (`Not implemented` or `Implemented`). Mark it `Implemented` when the approved work is complete.
- Treat plans as stable records of approved scope, architecture, and acceptance criteria. Do not update implemented plans for routine file changes, test additions, test counts, or measured coverage unless the approved plan itself changes.
- Inspect existing modules and conventions before adding dependencies or abstractions. Implement the requested behavior without restructuring unrelated code.

## Project tooling and validation

- Use pnpm for dependency management and scripts. Keep `pnpm-lock.yaml` synchronized with dependency changes.
- Use ESLint for linting and import sorting, and Prettier for formatting. Keep `prettier/prettier` enabled as an error so formatting violations appear in editor diagnostics. Do not reintroduce Biome or Oxlint without an explicit requirement.
- Follow `.prettierrc.json`: two-space indentation, single quotes, trailing commas, and semicolons only when needed. Prefix intentionally unused variables and parameters with `_`.
- Use `pnpm run lint` to check, `pnpm run lint:fix` to apply automatic fixes, and `pnpm run format` for formatting only. Review automatic fixes.
- For TypeScript or NestJS configuration changes, run `pnpm run build` to verify compilation. Use linting, type checks, and appropriate manual validation while automated tests are absent.
- For documentation-only changes, verify referenced paths and commands; application builds and tests are not required.
- Report failed checks and checks that could not run. Do not claim a passing lint check also verifies TypeScript types or runtime behavior.
- Do not manually edit generated build output, coverage output, `node_modules/`, or TypeScript build caches.

## NestJS structure and dependency injection

- Organize new features as cohesive NestJS modules under `src/<feature>/`, keeping their controllers, services, and DTOs together. Keep the existing root application files unless a feature requires extraction.
- Keep `AppModule` focused on application composition and `main.ts` focused on bootstrapping and global application setup.
- Keep controllers focused on HTTP input, delegation, and responses. Put orchestration and application logic in injectable services; put external-service details behind injectable adapters.
- Reuse existing providers through module imports and exports. Export only the providers other modules need; avoid duplicating provider registrations or constructing injected services with `new`.
- Prefer constructor injection with `private readonly` dependencies. Use explicit injection tokens when injecting interfaces or multiple implementations of the same contract.
- Avoid circular dependencies. Review module responsibilities before introducing `forwardRef`.
- Prefer named exports for classes, functions, constants, and types. Use default exports only where a tool or framework expects them, such as configuration files.
- Use NestJS filename conventions such as `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.dto.ts`, `*.guard.ts`, and `*.adapter.ts`.
- This project uses ESM with TypeScript NodeNext resolution. Use `.js` extensions in relative TypeScript imports, matching the emitted files. Do not introduce path aliases without configuring both compilation and runtime resolution.
- Preserve value imports for injected classes and DTO classes required by decorator metadata. Use `import type` only for symbols with no runtime role. `@typescript-eslint/consistent-type-imports` uses the TypeScript configuration and skips decorated files with legacy decorator metadata; do not force type-only imports for runtime dependencies.

## HTTP contracts and validation

- Define explicit request and response contracts. Use concrete DTO classes when NestJS validation, transformation, or Swagger needs runtime metadata; TypeScript types alone do not validate incoming requests.
- Validate untrusted bodies, path parameters, query parameters, and relevant headers at the HTTP boundary. Use pipes for parsing and validation instead of repeating conversions in controllers.
- Reuse the established validation approach. The current project has no configured DTO validation library or global validation pipe; add and configure the required tooling when implementing validation rather than assuming it is active.
- Provide clear validation messages for constraints. Do not infer that API errors must use Brazilian Portuguese from the former frontend's localized Zod configuration; follow the API contract or an explicit language requirement.
- Use NestJS HTTP exceptions and consistent error responses. Translate upstream failures at the integration boundary; do not expose raw upstream bodies, stack traces, or credentials to clients.
- Keep API routes, status codes, pagination, and response shapes consistent with the existing contract. Prefer one-based pagination defaulting to page `1` for new contracts unless downstream requirements specify otherwise.
- Keep Swagger metadata aligned with implemented contracts when adding or changing documented endpoints.
- Use guards for authentication and authorization, pipes for validation, interceptors for cross-cutting request/response behavior, and exception filters for shared error translation when those boundaries are needed.
- Register required guards, pipes, interceptors, and middleware explicitly. Importing a module or installing a package alone does not activate protection or validation.

## Gateway integrations and configuration

- Keep this API gateway focused on routing, authentication boundaries, aggregation, and protocol adaptation. Keep business rules and persistence owned by downstream services in those services unless the requested architecture says otherwise.
- Put application-facing third-party integrations under `src/adapters/`, or the owning feature's `adapters/` directory. Expose named methods through injectable providers; controllers and general utilities should not issue outbound HTTP requests directly.
- Reuse the installed `@nestjs/axios` integration and existing adapters before adding another HTTP client. Configure service URLs and credentials through application configuration.
- Use injected `ConfigService` in providers. Keep direct `process.env` access at configuration or bootstrap boundaries. Validate required configuration at startup when introducing it; do not silently default missing credentials or required upstream URLs.
- Configure finite outbound request timeouts and handle transport failures, upstream error responses, and malformed responses. Add retries only when the operation is safe to retry or has an explicit idempotency strategy.
- Forward only headers and credentials required by the downstream contract. Do not blindly forward all inbound headers or return upstream headers unchanged.
- Prefer NestJS `Logger` for application logs. Do not log secrets, authorization headers, tokens, or sensitive request payloads.
- Preserve generated API clients if introduced later: never manually edit generated files. Do not add wrappers or response mappers solely to rename or flatten fields when the existing contract already meets the consumer's needs.

## General code organization

- Use `src/lib/` only for configuration and initialization of installed libraries, and `src/utils/` for reusable pure helpers. Keep feature-specific mapping and domain helpers near their feature.
- Extract reusable code when there is a concrete shared use; do not add generic base services, repositories, or utility layers for a single use case.
- Prefer guard clauses and early returns when a condition can finish the current control-flow path. Keep `else` when it makes mutually exclusive branches clearer.
- Never use `void` to discard a promise. Await asynchronous operations in async functions, or return the promise when forwarding it to a caller that handles it. Explicitly handle errors for intentional background work.
- Do not block the Node.js event loop with synchronous I/O or expensive CPU work in request handlers.
- Prefer precise types and `unknown` with narrowing at untrusted boundaries. ESLint permits explicit `any`, but that is not a reason to discard available types.

## Automated testing

- Automated test infrastructure, scripts, and starter tests have intentionally been removed for now. Do not reintroduce them during unrelated implementation work.
- Add automated tests and choose their tooling only when the user explicitly requests a testing phase. Manual validation, linting, builds, and type checks remain permitted.
- When testing is reintroduced, document its commands and conventions alongside the implemented setup rather than assuming a previous test runner or coverage policy is still configured.
