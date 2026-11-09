import { Controller, Get, Param } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import { HealthStatus } from '@/common/health-check/health-check.interface.js'
import { HealthCheckService } from '@/common/health-check/health-check.service.js'

import { HealthService } from './health.service.js'

// Expose process health, fresh dependency checks, and cached observations.
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly healthCheckService: HealthCheckService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Gateway health check' })
  @ApiOkResponse({
    description: 'Gateway healthy',
  })
  async getHealth() {
    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
    }

    return response
  }

  @Get('services')
  @ApiOperation({ summary: 'All services health check' })
  @ApiOkResponse({ description: 'All services status' })
  async getServicesHealth() {
    // Dependency state changes the response body, not the successful HTTP status.
    const services = await this.healthCheckService.checkAllServices()

    const overallStatus = services.every(
      (service) => service.status === HealthStatus.HEALTHY,
    )
      ? HealthStatus.HEALTHY
      : services.some((service) => service.status === HealthStatus.HEALTHY)
        ? HealthStatus.DEGRADED
        : HealthStatus.UNHEALTHY

    const response = {
      overallStatus,
      timestamp: new Date().toISOString(),
      services,
      summary: {
        total: services.length,
        healthy: services.filter(
          (service) => service.status === HealthStatus.HEALTHY,
        ).length,
        unhealthy: services.filter(
          (service) => service.status === HealthStatus.UNHEALTHY,
        ).length,
        degraded: services.filter(
          (service) => service.status === HealthStatus.DEGRADED,
        ).length,
      },
    }

    return response
  }

  @Get('services/:serviceName')
  @ApiOperation({ summary: 'Specific service health check' })
  @ApiOkResponse({ description: 'Service status' })
  async getServiceHealth(@Param('serviceName') serviceName: string) {
    // Cache-only lookup: no probe or expiry check; unknown also covers unchecked names.
    const cached = this.healthCheckService.getCachedHealth(serviceName)

    if (!cached) {
      return {
        status: 'unknown',
        message: 'Service not found or never checked',
        timestamp: new Date().toISOString(),
      }
    }

    return cached
  }

  @Get('ready')
  @ApiOperation({ summary: 'Get readiness status' })
  @ApiOkResponse({
    description: 'Readiness status retrieved successfully',
  })
  async getReady() {
    const ready = this.healthService.getReadyStatus()

    return ready
  }

  @Get('live')
  @ApiOperation({ summary: 'Get liveness status' })
  @ApiOkResponse({
    description: 'Liveness status retrieved successfully',
  })
  async getLive() {
    const live = this.healthService.getLiveStatus()

    return live
  }
}
