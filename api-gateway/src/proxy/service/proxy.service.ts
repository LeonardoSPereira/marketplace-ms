import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'

import { CircuitBreakerService } from '@/common/circuit-breaker/circuit-breaker.service.js'
import { Role } from '@/common/dtos/role.dto.js'
import { CacheFallbackService } from '@/common/fallback/cache.fallback.js'
import { DefaultFallbackService } from '@/common/fallback/default.fallback.js'
import { serviceConfig } from '@/config/gateway.config.js'

interface UserInfo {
  userId: string
  email: string
  role: Role
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

@Injectable()
export class ProxyService {
  // Use the class name as the context shown in Nest's log output.
  private readonly logger = new Logger(ProxyService.name)

  constructor(
    private readonly httpService: HttpService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly cacheFallbackService: CacheFallbackService,
    private readonly defaultFallbackService: DefaultFallbackService,
  ) {}

  // Shared outbound HTTP helper; no controller currently exposes forwarding.
  async proxyRequest(
    // keyof restricts callers to the configured service names at compile time.
    serviceName: keyof typeof serviceConfig,
    method: HttpMethod,
    path: string,
    data?: unknown,
    headers?: Record<string, string>,
    userInfo?: UserInfo,
  ): Promise<unknown> {
    const service = serviceConfig[serviceName]
    // Callers supply the downstream path, including its leading slash.
    const url = `${service.url}${path}`

    // Failed operations and open circuits use the same per-service fallback.
    // All paths and methods for this service share one circuit key.
    const fallback = this.createServiceFallback(serviceName, method, path)

    const circuitBreakerResult =
      await this.circuitBreakerService.executeWithCircuitBreaker(
        async () => {
          // Copy the supplied headers and add caller-provided user context.
          // This method does not verify identity or filter forwarded headers.
          const enhancedHeaders = {
            ...headers,
            'x-user-id': userInfo?.userId,
            'x-user-email': userInfo?.email,
            'x-user-role': userInfo?.role,
          }

          // HttpService returns an RxJS Observable. Convert its first response into
          // a Promise so this method can use async/await.
          const response = await firstValueFrom(
            this.httpService.request({
              method: method.toLowerCase() as any,
              url,
              data,
              headers: enhancedHeaders,
              timeout: service.timeout,
            }),
          )

          // Cache keys omit caller identity and headers; only product GET
          // fallbacks read this cache. Do not assume isolation between users.
          if (method.toLowerCase() === 'get') {
            this.cacheFallbackService.setCachedData(
              `${serviceName}-${path}`,
              response.data,
            )
          }

          // Return the response body; Promise<unknown> also covers fallback data.
          // No CircuitBreakerResult envelope or fallback provenance is returned.
          return response.data
        },
        fallback,
        `proxy-${serviceName}`,
        {
          // Open after three operation failures; retry eligibility after 30 s.
          // timeout does not enforce a deadline; Axios uses service.timeout.
          failureThreshold: 3,
          timeout: 30_000,
          resetTimeout: 30_000,
        },
      )

    return circuitBreakerResult
  }

  // Probe a downstream service without making its failure reject /health.
  async getServiceHealth(serviceName: keyof typeof serviceConfig) {
    try {
      const service = serviceConfig[serviceName]

      const response = await firstValueFrom(
        this.httpService.get(`${service.url}/health`, {
          timeout: 3000, // Health probes use a separate three-second timeout.
        }),
      )

      // A successful HTTP response counts as healthy; its body is not validated.
      return {
        status: 'healthy',
        data: response.data,
      }
    } catch (error: unknown) {
      // Turn transport failures and rejected HTTP responses into health data.
      return {
        status: 'unhealthy',
        error: (error as Error).message,
      }
    }
  }

  // Product GET failures return cached data or a fixed empty listing. Other
  // operations throw plain errors; none of these policies apply to auth routes.
  private createServiceFallback(
    serviceName: string,
    method: string,
    path: string,
  ) {
    switch (serviceName) {
      case 'users': {
        if (path.includes('/auth/login')) {
          return this.defaultFallbackService.createErrorFallback(
            'users',
            'Authentication service unavailable',
          )
        }

        return this.defaultFallbackService.createErrorFallback(
          'users',
          'User service unavailable',
        )
      }

      case 'products': {
        if (method.toLowerCase() === 'get') {
          return this.cacheFallbackService.createCacheFallback(
            `products-${path}`,
            { products: [], total: 0, page: 1, limit: 10 },
          )
        }

        return this.defaultFallbackService.createErrorFallback(
          'products',
          'Product service unavailable',
        )
      }
      case 'checkout': {
        return this.defaultFallbackService.createErrorFallback(
          serviceName,
          `${serviceName} service unavailable`,
        )
      }
      case 'payments': {
        return this.defaultFallbackService.createErrorFallback(
          serviceName,
          `${serviceName} service unavailable`,
        )
      }

      default: {
        return this.defaultFallbackService.createErrorFallback(
          serviceName,
          'Service unavailable',
        )
      }
    }
  }
}
