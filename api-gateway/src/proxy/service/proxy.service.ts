import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'

import { CircuitBreakerService } from '@/common/circuit-breaker/circuit-breaker.service.js'
import { Role } from '@/common/dtos/role.dto.js'
import { CacheFallbackService } from '@/common/fallback/cache.fallback.js'
import { DefaultFallbackService } from '@/common/fallback/default.fallback.js'
import { RetryService } from '@/common/retry/retry.service.js'
import { TimeoutService } from '@/common/timeout/timeout.service.js'
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
    private readonly timeoutService: TimeoutService,
    private readonly retryService: RetryService,
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

    // 1st STEP: CIRCUIT BREAKER (per-service state; one failure equals an exhausted retry cycle)
    const circuitBreakerResult =
      await this.circuitBreakerService.executeWithCircuitBreaker(
        // 2nd STEP: RETRY (up to 5 total attempts with exponential backoff and jitter;
        // retries all methods and statuses without idempotency or 4xx checks)
        async () => {
          return await this.retryService.executeWithExponentialBackoff(
            // 3rd STEP: TIMEOUT (Promise.race per-attempt deadline in ms, alongside Axios timeout)
            async () => {
              return await this.timeoutService.executeWithCustomTimeout(
                // 4th STEP: OPERATION
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
                service.timeout,
              )
            },
            4, // 4 retries = up to 5 total attempts per circuit-breaker execution
          )
        },
        fallback,
        `proxy-${serviceName}`,
        {
          // Open after three exhausted retry cycles (up to 15 HTTP attempts);
          // retry eligibility after 30 s. timeout does not enforce a deadline.
          failureThreshold: 3,
          timeout: 30_000,
          resetTimeout: 30_000,
        },
      )

    return circuitBreakerResult
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
