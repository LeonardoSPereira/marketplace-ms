import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'

import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { LoggingMiddleware } from './middleware/logging/logging.middleware.js'
import { MiddlewareModule } from './middleware/middleware.module.js'
import { ProxyModule } from './proxy/proxy.module.js'

// The root module connects feature modules, HTTP controllers, and providers.
@Module({
  imports: [
    // Load .env values and make ConfigService available throughout the app.
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Define named request windows (ttl is in milliseconds). These options
    // alone do not enforce limits: no ThrottlerGuard is currently registered.
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1_000, // 1 second
        limit: 100, // 100 requests per second
      },
      {
        name: 'medium',
        ttl: 60_000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 900_000, // 15 minutes
        limit: 1000, // 1000 requests per 15 minutes
      },
    ]),
    ProxyModule,
    MiddlewareModule,
  ],
  controllers: [AppController], // Register the HTTP route handlers.
  providers: [AppService], // Let Nest create and inject this service.
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Registering middleware here activates it for all matched routes.
    // Listing the class as a provider alone would not run it on requests.
    consumer.apply(LoggingMiddleware).forRoutes('*')
  }
}
