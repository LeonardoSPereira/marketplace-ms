import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'

import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { AuthModule } from './auth/auth.module.js'
import { CustomThrottlerGuard } from './guards/throttler.guard.js'
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
    // Resolve request limits through injected configuration; ttl is in milliseconds.
    // The APP_GUARD provider below activates the custom guard for controllers.
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          name: 'short',
          ttl: 1_000, // 1 second
          limit: configService.get<number>('RATE_LIMIT_SHORT', 10),
        },
        {
          name: 'medium',
          ttl: 60_000, // 1 minute
          limit: configService.get<number>('RATE_LIMIT_MEDIUM', 100),
        },
        {
          name: 'long',
          ttl: 900_000, // 15 minutes
          limit: configService.get<number>('RATE_LIMIT_LONG', 1000),
        },
      ],
    }),
    ProxyModule,
    MiddlewareModule,
    AuthModule,
  ],
  controllers: [AppController], // Register the HTTP route handlers.
  providers: [
    AppService,
    // Register a global guard through DI so Nest supplies its dependencies.
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Registering middleware here activates it for all matched routes.
    // Listing the class as a provider alone would not run it on requests.
    consumer.apply(LoggingMiddleware).forRoutes('*')
  }
}
