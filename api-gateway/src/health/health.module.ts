import { Module } from '@nestjs/common'

import { HealthCheckModule } from '../common/health-check/health-check.module.js'
import { HealthController } from './health.controller.js'
import { HealthService } from './health.service.js'

// Import the owning module to inject its shared, exported HealthCheckService.
@Module({
  imports: [HealthCheckModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
