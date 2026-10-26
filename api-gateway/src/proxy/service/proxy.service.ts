import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import type { AxiosResponse } from 'axios'
import { firstValueFrom } from 'rxjs'

import { serviceConfig } from '../../config/gateway.config.js'

@Injectable()
export class ProxyService {
  // Use the class name as the context shown in Nest's log output.
  private readonly logger = new Logger(ProxyService.name)

  constructor(private readonly httpService: HttpService) {}

  // Shared outbound HTTP helper; no controller currently exposes forwarding.
  async proxyRequest(
    // keyof restricts callers to the configured service names at compile time.
    serviceName: keyof typeof serviceConfig,
    method: string,
    path: string,
    data?: any,
    headers?: any,
    userInfo?: any,
  ): Promise<AxiosResponse<unknown>> {
    const service = serviceConfig[serviceName]
    // Callers supply the downstream path, including its leading slash.
    const url = `${service.url}${path}`

    try {
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

      // Keep the full Axios response, including status, headers, and data.
      return response
    } catch (error) {
      this.logger.error(
        `Error proxying ${method} request to ${serviceName}: ${url}`,
      )
      // Preserve the original error; no HTTP exception translation occurs here.
      throw error
    }
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
    } catch (error: any) {
      // Turn transport failures and rejected HTTP responses into health data.
      return {
        status: 'unhealthy',
        error: error.message,
      }
    }
  }
}
