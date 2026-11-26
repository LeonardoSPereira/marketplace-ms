# Operations and troubleshooting

Reviewed: 2026-11-24 (initial checkout-service baseline).

## Commands

Run all commands from `checkout-service/` using `pnpm` (source of truth: [`package.json`](../package.json)):

| Command | Purpose |
| --- | --- |
| `pnpm install` | Install dependencies according to `pnpm-lock.yaml` |
| `pnpm run dev` | Start the NestJS service in watch mode (`nest start --watch`) |
| `pnpm run start` | Start the NestJS service once (`nest start`) |
| `pnpm run start:debug` | Start with debugger and watch mode (`nest start --debug --watch`) |
| `pnpm run build` | Compile TypeScript into `dist/` (`nest build`) |
| `pnpm run start:prod` | Run compiled output (`node dist/main`) |
| `pnpm run lint` | Run ESLint (including Prettier formatting and import sorting checks) |
| `pnpm run lint:fix` | Run ESLint with automatic fixes |
| `pnpm run format` | Format files with Prettier |

Automated test infrastructure and scripts are intentionally absent for the current learning phase. Passing `pnpm run lint` verifies style and ESLint rules, not full NestJS runtime behavior; `pnpm run build` verifies TypeScript compilation, not broker or database connectivity.

## Health interpretation

No `/health`, `/health/ready`, or `/health/live` endpoints are implemented yet (`GAP-003`).

- The only active HTTP route is `GET /` (returning `'Hello World!'` with HTTP 200), which confirms only that the Express HTTP server is listening.
- A listening HTTP server does **not** prove RabbitMQ is connected: `RabbitmqService.onModuleInit()` catches connection errors and allows the application to start without a message queue (`LIM-001`).
- No PostgreSQL connection is active at startup because `TypeOrmModule` is not registered yet (`GAP-001`).

## Logs

- **Bootstrap log:** [`src/main.ts`](../src/main.ts) prints `🛒 Checkout Service is running on http://localhost:${port}` via `console.log` (not NestJS `Logger`).
- **RabbitMQ logs:** [`RabbitmqService`](../src/events/rabbitmq/rabbitmq.service.ts) uses NestJS `Logger(RabbitmqService.name)` for connection lifecycle events (`Connected successfully`, `connection error`, `connection closed`, `connection blocked`, `connection unblocked`, `channel closed`, `Disconnected`) and publish outcomes.
- **Sensitive payload caution:** `RabbitmqService.publishMessage` currently calls `this.logger.debug(\`Message content: ${JSON.stringify(message)}\`)`, which would emit full message payloads when debug logging is enabled (`LIM-003`).
- No HTTP request logging middleware is registered yet.

## Local RabbitMQ dependency

To run with a local RabbitMQ broker, start the shared broker in [`../messaging/`](../../messaging/README.md):

```sh
cd ../messaging
docker compose up -d
```

The default `RABBITMQ_URL` (`amqp://admin:admin@localhost:5672`) matches the local Compose setup. RabbitMQ Management UI is available at `http://localhost:15672` when that container is running.

## Common symptoms

| Symptom | What to check in `checkout-service` |
| --- | --- |
| `⚠️ Failed to connect to RabbitMQ, continuing without message queue` on startup | Verify the RabbitMQ container in `../messaging` is running on port `5672` and that `RABBITMQ_URL` is exported in the shell if using non-default credentials or host |
| Changes in `.env` have no effect | `ConfigModule.forRoot()` is not registered in [`src/app.module.ts`](../src/app.module.ts); export variables in the shell before starting until `.forRoot()` is added (`LIM-002`) |
| `⚠️ RabbitMQ: channel not available, skipping message publish` | RabbitMQ failed to connect at startup or the channel was closed; `RabbitmqService` does not currently reconnect automatically (`LIM-001`) |
| API Gateway health probe to checkout fails | Confirm `checkout-service` is listening on `PORT=8003` (default) and note that `checkout-service` does not yet expose a `/health` route (`GAP-003`) |

## Source and related documents

- [`package.json`](../package.json), [`src/main.ts`](../src/main.ts), [`src/events/rabbitmq/rabbitmq.service.ts`](../src/events/rabbitmq/rabbitmq.service.ts)
- [Architecture](architecture.md)
- [Configuration](configuration.md)
- [RabbitMQ implementation](implementation/rabbitmq.md)
- [Development status](development-status/README.md)
