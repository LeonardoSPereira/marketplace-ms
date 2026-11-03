# Repository workflow rules

## Communication and documentation

- Use English in chat and repository documentation unless the user explicitly requests another language. When a prompt mixes languages, ask which language to use.
- Use Context7 for current library, framework, SDK, API, CLI, and cloud-service documentation. Resolve the library ID first, then query the selected library with the specific question. Prefer documentation matching the installed version. This is not required for general programming concepts, business-logic debugging, refactoring, or code review without library-specific questions.
- Treat `package.json`, `eslint.config.mjs`, `.prettierrc.json`, `tsconfig.json` as the source of truth for installed tools, commands, formatting, and compiler behavior.

## Learning notes and documentation maintenance

- This is a learning project for backend development, NestJS, and microservices. Keep explanations approachable and grounded in the actual implementation.
- When adding or changing files, inspect related modules, imports/exports, provider and middleware registration, request flow, configuration, and error handling to understand what is actually active. Preserve existing user changes.
- Add or update concise descriptive comments explaining each file's responsibility and the relevant concepts: dependency injection, framework registration, asynchronous flow, configuration defaults and units, and failure behavior. Explain why and how meaningful parts work without narrating every line or repeating obvious names.
- Keep comments accurate when behavior changes; distinguish configured options from enforced behavior and helpers from exposed HTTP functionality. Do not change runtime behavior solely to match an explanation.
- Update `README.md` when features, behavior, setup commands, environment variables, or relevant limitations change. Keep it brief, describe implemented functionality only, keep the current functionality section last, and leave route inventories to Swagger.
- Maintain the root README documentation checklist as documents and architectural questions arise. Check an item only when its linked document exists; document completion does not mean the feature is implemented or its open questions are resolved.

## Documentation structure and maintenance

- Treat code and active framework registrations as evidence for implementation guides. Before documenting changed behavior, read the affected code and related guides, ADRs, and development-status entries; do not infer implemented capabilities from package installations, helper classes, DTO types, or Swagger tags.
- Keep `documents/architecture.md` focused on module responsibilities, service boundaries, and active request flow; `documents/configuration.md` on environment variables, defaults, units, validation, and load timing; and `documents/operations.md` on health interpretation, logs, commands, and troubleshooting.
- Keep detailed mechanics such as logging and throttling under `documents/implementation/`. Maintain `documents/auth-and-swagger.md` for auth flow, DTO responsibilities, Swagger metadata, and validation boundaries. Add focused guides when new behavior merits an explanation; reuse existing documents instead of creating duplicate descriptions.
- Update affected guides and source comments in the same change that alters behavior. Describe current behavior separately from intended improvements, missing functionality, and unresolved choices. Do not change runtime behavior merely to satisfy a document.
- Link related guides, ADRs, development-status entries, and source files with relative Markdown links. Prefer linking to the detailed explanation over copying it into several documents; keep any brief summaries consistent.
- Use ISO 8601 dates (`YYYY-MM-DD`) for document snapshots and resolution dates. Update a snapshot or updated date when its content is reviewed or changed; do not imply that unrelated documents were revalidated.
- For documentation changes, check formatting, local links, referenced paths, and commands against the repository. Review renamed or moved documents for incoming links. Application builds and tests are not required for documentation-only work.

## ADR maintenance

- Store Architecture Decision Records in `documents/ADR/` using the next unused four-digit number and a descriptive filename, such as `0007-topic.md`. Keep existing record numbers and filenames stable where possible.
- Include a recorded date, explicit status and scope, context, decision and implementation state, alternatives, consequences and limitations, open questions, and source evidence. Distinguish a decision's approval status from whether its implementation exists.
- Retrospective records describe observed architecture; do not invent historical approval, rationale, or alternatives previously evaluated. Recording defects or constraints does not endorse them, and listing an alternative does not approve its implementation.
- Keep `documents/ADR/README.md` as the complete ADR index with links, topics, and current statuses. Update it when records are added, renamed, resolved, or superseded, and update the root README documentation links/checklist when relevant.
- Preserve decision history. Correct factual errors and link resolutions when needed; use a new ADR for a materially changed decision, mark the previous record superseded, and link both. Do not rewrite an old decision as though the new design had always applied.
- Link unresolved decisions to the development-status register. When resolved, record the outcome and evidence in the relevant ADR or a successor, then update the register and affected guides. Do not treat resolution as implemented until code evidence supports that status.

## Development-status register maintenance

- Maintain `documents/development-status/README.md` as the register index, scope, status conventions, and maintenance instructions. Keep `not-implemented.md` for absent or unwired capabilities, `limitations.md` for constrained existing behavior, and `open-questions.md` for unresolved decisions.
- Use stable, unique IDs with the next unused number in each category: `GAP-001`, `LIM-001`, and `DEC-001`. Do not renumber existing entries or reuse retired IDs. Related entries may overlap; cross-link them when useful.
- Add or update entries when work reveals a meaningful gap, limitation, or open decision. Include the observed state and links to source-backed guides or ADRs. Avoid presenting optional capabilities as required work before requirements establish a need.
- Keep an explicit status for entries, either individually or through a shared status statement for the whole register. When resolving an entry, retain its ID and description, record the resolution date and evidence, and update shared status statements so resolved entries are not still labeled open.
- Treat the registers as current-state tracking, not an approved implementation plan, priority order, or release commitment. Keep approved implementation scope in plans and architectural outcomes in ADRs.
- State that the gateway and the other services forming this microservices project are under active development and substantial functionality will arrive as the project evolves. Track verified gateway observations; do not infer another service's completeness from missing gateway functionality or claim that service was audited without inspecting it.

## README maintenance

- Keep the root `README.md` concise: project purpose and development status, usable local setup, links to deeper documentation, the documentation checklist, and current functionality. Keep `Current functionalities` as the final section and leave endpoint inventories to Swagger.
- Preserve a prominent explanation that the gateway and related microservices are evolving, incomplete learning projects. Development status is context, not a substitute for clearly documenting known limitations or a claim of production readiness.
- Link the ADR index, development-status index, and relevant guides from the root README. Keep remaining documentation tasks unchecked until documents exist; a checked document item must not imply that its underlying feature or follow-up work is complete.
- Keep folder README files focused on navigation, scope, status conventions, and maintenance rules for their own contents. Update each affected index when adding, moving, renaming, or changing the status of its documents. Do not copy the root setup instructions or full implementation guides into every index.
- Reconcile README summaries with detailed guides after behavior changes. Keep examples and environment instructions aligned with `package.json`, `.env.example`, and active code; distinguish configured options from enforced guarantees.

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
- Reuse the established validation approach. The project uses `class-validator`, `class-transformer`, and a global `ValidationPipe` with transformation, whitelisting, and rejection of non-whitelisted fields. Login and registration use concrete DTO classes; add validation decorators to new input DTOs rather than relying on TypeScript types or Swagger metadata.
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
