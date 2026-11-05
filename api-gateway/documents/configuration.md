# Configuration and startup

Reviewed: 2026-11-05

Configuration currently uses both ConfigService and direct environment reads.
There is no application-wide startup schema that validates required settings.
See [the example file](../.env.example) for variable names; empty values are not
always equivalent to omitted variables.

| Variable               | Default when absent     | Consumer and behavior                                                                                                          |
| ---------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `PORT`                 | `8000`                  | Bootstrap uses `process.env.PORT ?? 8000`; an empty string does not select the fallback                                        |
| `JWT_SECRET`           | No usable default       | AuthModule passes ConfigService value to JWT support; inactive JwtStrategy reads the environment with an empty-string fallback |
| `USERS_SERVICE_URL`    | `http://localhost:8001` | Import-time service configuration; empty string also falls back                                                                |
| `PRODUCTS_SERVICE_URL` | `http://localhost:8002` | Same import-time behavior                                                                                                      |
| `CHECKOUT_SERVICE_URL` | `http://localhost:8003` | Same import-time behavior                                                                                                      |
| `PAYMENTS_SERVICE_URL` | `http://localhost:8004` | Same import-time behavior                                                                                                      |
| `CORS_ORIGIN`          | Any origin              | Bootstrap splits comma-separated values without trimming; empty string allows no nonempty browser origin                       |
| `RATE_LIMIT_SHORT`     | `10`                    | Request count for configured 1,000 ms window                                                                                   |
| `RATE_LIMIT_MEDIUM`    | `100`                   | Request count for configured 60,000 ms window                                                                                  |
| `RATE_LIMIT_LONG`      | `1000`                  | Request count for configured 900,000 ms window                                                                                 |

## Load timing

ConfigModule.forRoot loads .env and makes ConfigService global. Its consumers
include async module factories for JWT and throttling. However, gateway.config.ts
reads downstream URLs while modules are imported, before ConfigModule's loading
has necessarily occurred. Export URL variables in the launching environment
before startup to make them available to these reads. Editing .env or the shell
after the process starts does not update the serviceConfig object.

Do not assume ConfigService.get<number> validates or converts environment values;
the generic is a TypeScript annotation. Rate-limit values have no application
startup validation. Use numeric counts and consult the throttling guide before
interpreting configured counts as independent enforced quotas.

## Fixed options and units

Service request timeouts are 10,000 milliseconds in gateway.config.ts; health
probes use 3,000 milliseconds directly in ProxyService. These are not environment
options. Internal proxy circuits use a failure threshold of 3 and a 30,000 ms
reset delay. Their `timeout: 30_000` option does not enforce an operation deadline.
The generic breaker defaults are 5 failures, `timeout: 60_000`, and
`resetTimeout: 30_000`. Cache fallback max age defaults to 300,000 ms. These values
are fixed in code and apply only to the internal helper; see
[proxy resilience](implementation/proxy-resilience.md). The JWT module has a 24-hour signing default, but login does not sign
tokens. The documented response expiresIn unit remains unspecified.

CORS accepts requests without Origin. Configured browser origins must match
exactly, including scheme and port; avoid spaces between comma-separated entries.
CORS allows credentials, caches preflights for 86,400 seconds, and does not list
x-session-token in allowedHeaders. Session guards are inactive. Helmet's HSTS
maxAge is 31,536,000 seconds. No trust-proxy configuration is set in bootstrap.

## Local use

Run `pnpm install`, then `pnpm run dev` from the gateway directory. Supply a
nonempty secret before using local JWT verification. Startup currently does not
prove downstream connectivity or confirm that JWT configuration is usable.

Source: [bootstrap](../src/main.ts), [service configuration](../src/config/gateway.config.ts),
[root module](../src/app.module.ts), [auth module](../src/auth/auth.module.ts).
See [operations](operations.md) and [throttling](implementation/throttling.md).
