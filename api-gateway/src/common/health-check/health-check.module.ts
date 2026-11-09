import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'

import { CircuitBreakerModule } from '../circuit-breaker/circuit-breaker.module.js'
import { HealthCheckService } from './health-check.service.js'

// Supply the probe service's dependencies here; sibling modules do not expose
// their imports. Export the service so HealthModule can reuse its health cache.
@Module({
  imports: [HttpModule, CircuitBreakerModule],
  exports: [HealthCheckService],
  providers: [HealthCheckService],
})
export class HealthCheckModule {}
