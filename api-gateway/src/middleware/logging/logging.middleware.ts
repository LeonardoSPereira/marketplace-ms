import { Injectable, Logger, NestMiddleware } from '@nestjs/common'

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  // Group these messages under the HTTP context in Nest's logger.
  private readonly logger = new Logger('HTTP')

  use(req: any, res: any, next: () => void) {
    const { method, originalUrl, ip } = req
    const userAgent = req.get('User-Agent') || ''
    const startTime = Date.now() // Capture timing separately for each request.

    this.logger.log(
      `Incoming request: ${method} ${originalUrl} - IP: ${ip} - User-Agent: ${userAgent}`,
    )

    // Wait until the response is written to record its final status and time.
    // This event does not guarantee that the client received the response.
    res.on('finish', () => {
      const { statusCode } = res
      const contentLength = res.get('Content-Length') || 0
      const duration = Date.now() - startTime

      this.logger.log(
        `Outgoing response: ${method} ${originalUrl} - Status: ${statusCode} - Content-Length: ${contentLength}b - Duration: ${duration}ms`,
      )

      // HTTP failures produce an additional error-level log entry.
      if (statusCode >= 400) {
        this.logger.error(
          `Error response: ${method} ${originalUrl} - Status: ${statusCode} - Duration: ${duration}ms`,
        )
      }
    })

    // Response-stream errors are distinct from HTTP error status codes.
    res.on('error', (error: Error) => {
      this.logger.error(
        `Error response: ${method} ${originalUrl} - Error: ${error.message}`,
      )
    })

    // Observe timeout events; this listener does not configure a timeout.
    res.on('timeout', () => {
      this.logger.warn(
        `Timeout response: ${method} ${originalUrl} - Duration: ${Date.now() - startTime}ms`,
      )
    })

    // Continue the request pipeline; otherwise the request would stay pending.
    next()
  }
}
