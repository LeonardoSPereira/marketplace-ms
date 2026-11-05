import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'

import { CircuitBreakerModule } from '@/common/circuit-breaker/circuit-breaker.module.js'
import { FallbackModule } from '@/common/fallback/fallback.module.js'

import { ProxyService } from './service/proxy.service.js'

// Supply the HTTP client, circuit registry, and fallback providers to ProxyService.
// AuthModule has its own HTTP client and does not use this resilience path.
@Module({
  imports: [HttpModule, CircuitBreakerModule, FallbackModule],
  providers: [ProxyService],
  // Importing modules can inject this same provider through Nest's container.
  exports: [ProxyService],
})
export class ProxyModule {}
