import { Injectable } from '@nestjs/common'

import {
  HealthStatus,
  type ServiceHealth,
} from '@/common/health-check/health-check.interface.js'
import { HealthCheckService } from '@/common/health-check/health-check.service.js'

// Aggregate injected probe results and supply readiness/liveness bodies for
// HealthController (/health/ready and /health/live).
@Injectable()
export class HealthService {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  // Internal aggregation called by getReadyStatus(); not exposed as its own route.
  async getHealthStatus() {
    const healthChecks = await this.healthCheckService.checkAllServices()

    // Service names are dynamic keys; each value omits the name used as its key.
    const services: Record<string, Omit<ServiceHealth, 'name'>> = {}

    const results = {
      status: HealthStatus.HEALTHY,
      timestamp: new Date().toISOString(),
      gateway: {
        status: HealthStatus.HEALTHY,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
      services,
    }

    let hasUnhealthyServices = false

    healthChecks.forEach((serviceHealth) => {
      results.services[serviceHealth.name] = {
        status: serviceHealth.status,
        responseTime: serviceHealth.responseTime,
        lastCheck: serviceHealth.lastCheck,
        url: serviceHealth.url,
        ...(serviceHealth.error && { error: serviceHealth.error }),
      }

      if (serviceHealth.status === HealthStatus.UNHEALTHY) {
        hasUnhealthyServices = true
      }
    })

    // Any unhealthy dependency sets status to degraded (even if all fail), so
    // getReadyStatus() below reports not_ready whenever any service is unhealthy.
    if (hasUnhealthyServices) {
      results.status = HealthStatus.DEGRADED
    }

    return results
  }

  async getReadyStatus() {
    const healthStatus = await this.getHealthStatus()

    return {
      status:
        healthStatus.status === HealthStatus.HEALTHY ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
    }
  }

  async getLiveStatus() {
    const result = {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }

    return result
  }
}
