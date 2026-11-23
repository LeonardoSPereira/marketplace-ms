import { Module } from '@nestjs/common'

import { CircuitBreakerService } from './circuit-breaker.service.js'

// Export one injectable circuit registry for consumers importing this module.
@Module({
  providers: [CircuitBreakerService],
  exports: [CircuitBreakerService],
})
export class CircuitBreakerModule {}
