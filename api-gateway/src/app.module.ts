import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'

import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { ProxyModule } from './proxy/proxy.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 1 minute,
        limit: 100, // 100 requests per minute
      },
    ]),
    ProxyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
