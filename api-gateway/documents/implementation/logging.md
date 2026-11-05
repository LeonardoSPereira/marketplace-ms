# HTTP logging implementation

Reviewed: 2026-11-05

[LoggingMiddleware](../../src/middleware/logging/logging.middleware.ts) uses Nest
Logger with the HTTP context. [AppModule.configure](../../src/app.module.ts)
activates it with consumer.apply(...).forRoutes('*'); the provider declaration in
MiddlewareModule alone would not attach it to routes. It calls next after
registering response listeners so request handling can continue.

| Event                              | Recorded data                                    | Meaning                                                          |
| ---------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| Incoming request                   | Method, original URL, IP, User-Agent             | A matched request reached the middleware                         |
| Response finish                    | Status, Content-Length, elapsed milliseconds     | Response was written; does not prove client receipt              |
| HTTP status at least 400 on finish | Method, URL, status, elapsed time at error level | Additional entry alongside the normal outgoing log               |
| Response error                     | Method, URL, stream error message                | Response-stream failure, separate from HTTP status               |
| Response timeout                   | Method, URL, elapsed time at warn level          | An observed timeout event; listener does not configure a timeout |

Timing starts with Date.now per request. Content-Length comes from the response
header and falls back to zero; it is not a measured byte count. A missing
User-Agent becomes an empty string. There is no correlation ID, structured JSON
logging configuration, external log sink, or dedicated response-close handler.
Do not assume an aborted response always produces a finish log.

The middleware does not explicitly log bodies, Authorization headers, or token
headers. However, originalUrl includes query strings and path values, and there
is no redaction. Sensitive data embedded in URLs can therefore enter logs.
The internal circuit breaker logs operation errors and state transitions, while
fallback providers log cache keys, hits, defaults, and errors. ProxyService
itself declares a logger but currently makes no logging calls. These helper logs
are not emitted by auth or health paths. Cache keys include caller-supplied paths
and can contain sensitive URL data. AuthService maps failures without its own
detailed upstream log entry. See [proxy resilience](proxy-resilience.md).
Bootstrap currently prints startup URLs through console.log.

Use the [operations guide](../operations.md) to interpret failures. Future choices
about redaction, correlation, log retention, and sinks are unresolved; this guide
does not introduce those features.
