# Operations and troubleshooting

Reviewed: 2026-11-23

## Start and inspect

From the `messaging/` directory, start the RabbitMQ container with Docker Compose:

```sh
docker compose up -d
```

Check container status and logs:

```sh
docker compose ps
docker compose logs -f rabbitmq
```

When running locally with default ports:

- **AMQP endpoint:** `amqp://admin:admin@localhost:5672`
- **Management UI:** `http://localhost:15672` (sign in with `admin` / `admin`)

To stop the container while keeping persisted volume data, run `docker compose down`. To wipe all persisted queues, exchanges, messages, and user state, run `docker compose down -v`.

## Health interpretation

Docker runs the container health check configured in [`docker-compose.yml`](../docker-compose.yml) (`rabbitmq-diagnostics -q ping`) every `30s` with `timeout: 30s` and `retries: 5`.

- `rabbitmq-diagnostics -q ping` checks that the RabbitMQ node OS process and Erlang VM are alive and responsive.
- A `healthy` container status confirms the local broker node is running, but does not verify that expected `checkout` or `payments` exchanges, queues, or consumers are registered (`GAP-001`, `LIM-002`).

To run a manual diagnostic check against the running container:

```sh
docker compose exec rabbitmq rabbitmq-diagnostics -q ping
```

## Common symptoms

| Symptom | Check in this repository |
| --- | --- |
| Port `5672` or `15672` bind failure on startup | Another local RabbitMQ service or container is already listening on `5672` or `15672`; inspect local port bindings or stop conflicting containers |
| Edited credentials in `docker-compose.yml` do not take effect | `RABBITMQ_DEFAULT_USER` and `RABBITMQ_DEFAULT_PASS` only apply when `/var/lib/rabbitmq` is first initialized; run `docker compose down -v` and `docker compose up -d` to reinitialize |
| Expected `checkout` or `payments` exchanges/queues do not exist after startup | No `definitions.json` or application topology bootstrap is wired yet (`GAP-001`, `LIM-002`) |

## Current observability limits

Observability is currently limited to standard Docker container logs (`docker compose logs`) and the built-in RabbitMQ Management UI (`:15672`). No Prometheus metrics scraping, dead-letter queue alerting, centralized log forwarding, or distributed message trace correlation (`GAP-004`) is configured.

Evidence: [docker-compose.yml](../docker-compose.yml).
