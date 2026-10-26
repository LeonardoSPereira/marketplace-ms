import { Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'

import { LoggingMiddleware } from './logging/logging.middleware.js'

@Module({
  imports: [
    // A separate, unnamed throttler configuration from AppModule's windows.
    // It also requires a registered ThrottlerGuard to enforce request limits.
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
