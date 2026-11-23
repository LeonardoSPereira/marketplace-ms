# Configuration and startup

Reviewed: 2026-11-23

Configuration in `messaging/` is currently defined statically inside [`docker-compose.yml`](../docker-compose.yml). There is no `.env` file, `.env.example`, or startup schema validation in this workspace (`GAP-005`, `LIM-001`).

| Setting | Configured value | Consumer and behavior |
| --- | --- | --- |
| `image` | `rabbitmq:4-management` | Official RabbitMQ 4 image bundled with the `rabbitmq_management` plugin |
| `container_name` | `marketplace-rabbitmq` | Fixed Docker container name |
| `RABBITMQ_DEFAULT_USER` | `admin` | Default administrator username created on initial database bootstrap |
| `RABBITMQ_DEFAULT_PASS` | `admin` | Default administrator password created on initial database bootstrap |
| Port `5672:5672` | Host `5672` -> Container `5672` | Standard AMQP 0-9-1 TCP port for `checkout` and `payments` producer/consumer connections |
| Port `15672:15672` | Host `15672` -> Container `15672` | Management web UI (`http://localhost:15672`) and HTTP API |
| Volume `rabbitmq_data` | `/var/lib/rabbitmq` | Named Docker volume storing Mnesia metadata, definitions, and persisted messages |
| `restart` | `unless-stopped` | Automatically restarts the container unless explicitly stopped by the user |

## Health-check parameters and units

[`docker-compose.yml`](../docker-compose.yml) configures a Docker `healthcheck` block with the following fixed values:

- `test`: `rabbitmq-diagnostics -q ping`
- `interval`: `30s` (30 seconds between checks)
- `timeout`: `30s` (30 seconds before a single check attempt times out)
- `retries`: `5` (5 consecutive failures required for Docker to mark the container `unhealthy`)

## Volume persistence and credential changes

RabbitMQ applies `RABBITMQ_DEFAULT_USER` and `RABBITMQ_DEFAULT_PASS` only when initializing a fresh data directory inside `/var/lib/rabbitmq`. Editing those values in [`docker-compose.yml`](../docker-compose.yml) after the `rabbitmq_data` volume has already been initialized will not overwrite the existing user credentials unless the volume is removed (`docker compose down -v`) or users are updated via `rabbitmqctl` / the management UI.

## Local use

From the `messaging/` directory, start the broker in detached mode:

```sh
docker compose up -d
```

Stop the container while preserving the `rabbitmq_data` volume:

```sh
docker compose down
```

Source: [docker-compose.yml](../docker-compose.yml). See [operations](operations.md) and [known limitations](development-status/limitations.md).
