import { Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'

import { LoggingMiddleware } from '@/middleware/logging/logging.middleware.js'

@Module({
  imports: [
    // A separate, unnamed throttler configuration from AppModule's windows.
    // This is not another guard registration; AppModule registers the global guard.
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 1 minute in milliseconds
        limit: 100, // 100 requests per minute
      },
    ]),
  ],
  // AppModule.configure selects the routes where this middleware runs.
  providers: [LoggingMiddleware],
  exports: [],
})
export class MiddlewareModule {}
