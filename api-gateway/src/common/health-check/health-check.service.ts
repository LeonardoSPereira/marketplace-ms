import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom, timeout } from 'rxjs'

import { serviceConfig } from '@/config/gateway.config.js'

import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service.js'
import { HealthStatus, ServiceHealth } from './health-check.interface.js'

// Concurrent downstream probes with circuit isolation and an in-memory cache.
// No startup/scheduled checks or cache expiry are configured.
@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name)
  private readonly healthCache = new Map<string, ServiceHealth>()

  constructor(
    private readonly httpService: HttpService,
    private readonly circuitBreakerService: CircuitBreakerService,
  ) {}

  async checkServiceHealth(
    serviceName: keyof typeof serviceConfig,
  ): Promise<ServiceHealth> {
    const service = serviceConfig[serviceName]
    const startTime = Date.now()

    try {
      // Health keys use default breaker settings (5 failures, 30 s reset).
      // Axios and RxJS bound the HTTP wait using the configured milliseconds;
      // the breaker timeout option does not enforce an operation deadline.
      await this.circuitBreakerService.executeWithCircuitBreaker(
        async () => {
          const response = await firstValueFrom(
            this.httpService
              .get(`${service.url}/health`, {
                timeout: service.timeout,
              })
              .pipe(timeout(service.timeout)),
          )

          return response.status
        },
        async () => {
          throw new Error(
            `Circuit breaker fallback for health check on: ${serviceName}`,
          )
        },
        `health-${serviceName}`,
      )

      const responseTime = Date.now() - startTime

      const serviceHealth: ServiceHealth = {
        name: serviceName,
        url: service.url,
        status: HealthStatus.HEALTHY,
        responseTime,
        lastCheck: new Date(),
      }

      this.healthCache.set(serviceName, serviceHealth)

      return serviceHealth
    } catch {
      const responseTime = Date.now() - startTime

      const serviceHealth: ServiceHealth = {
        name: serviceName,
        url: service.url,
        status: HealthStatus.UNHEALTHY,
        responseTime,
        lastCheck: new Date(),
        error: 'Health check failed',
      }

      this.healthCache.set(serviceName, serviceHealth)
      this.logger.error(`Health check failed for ${serviceName}`)

      return serviceHealth
    }
  }

  async checkAllServices(): Promise<ServiceHealth[]> {
    const services: (keyof typeof serviceConfig)[] = [
      'users',
      'products',
      'checkout',
      'payments',
    ]

    // Start probes concurrently and preserve service order, including rejections.
    const healthChecks = await Promise.allSettled(
      services.map((serviceName) => this.checkServiceHealth(serviceName)),
    )

    const results = healthChecks.map((check, index) => {
      if (check.status === 'fulfilled') {
        return check.value
      }

      const rejected: ServiceHealth = {
        name: services[index],
        url: serviceConfig[services[index]].url,
        status: HealthStatus.UNHEALTHY,
        responseTime: 0,
        lastCheck: new Date(),
        error: 'Health check failed',
      }

      return rejected
    })

    return results
  }

  // Return the last stored object without refreshing, copying, or checking its age.
  getCachedHealth(serviceName: string): ServiceHealth | undefined {
    const cache = this.healthCache.get(serviceName)
    return cache
  }

  getAllCachedHealth(): ServiceHealth[] {
    const cache = Array.from(this.healthCache.values())
    return cache
  }
}
