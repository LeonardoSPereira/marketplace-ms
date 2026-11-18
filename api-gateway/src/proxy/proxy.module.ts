import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'

import { CircuitBreakerModule } from '@/common/circuit-breaker/circuit-breaker.module.js'
import { FallbackModule } from '@/common/fallback/fallback.module.js'
import { RetryModule } from '@/common/retry/retry.module.js'
import { TimeoutModule } from '@/common/timeout/timeout.module.js'

import { ProxyService } from './service/proxy.service.js'

// Supply HTTP, circuit, fallback, timeout, and retry providers to ProxyService.
// AuthModule and HealthCheckModule use their own HTTP paths without this stack.
@Module({
  imports: [
    HttpModule,
    CircuitBreakerModule,
    FallbackModule,
    TimeoutModule,
    RetryModule,
  ],
  providers: [ProxyService],
  // Importing modules can inject this same provider through Nest's container.
  exports: [ProxyService],
})
export class ProxyModule {}
