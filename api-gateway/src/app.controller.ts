import { Controller, Get } from '@nestjs/common'

import { AppService } from './app.service.js'
import { ProxyService } from './proxy/service/proxy.service.js'

// This prefix combines with each method's route: /health and /health/hello.
@Controller('health')
export class AppController {
  // Nest supplies these providers; ProxyService is exported by ProxyModule.
  constructor(
    private readonly appService: AppService,
    private readonly proxyService: ProxyService,
  ) {}

  @Get()
  async getHealth() {
    // Each inner await completes before the next call starts, so these checks
    // run sequentially despite Promise.all. Failures become unhealthy results
    // inside ProxyService rather than rejecting this handler.
    const [users, products, checkout, payments] = await Promise.all([
      await this.proxyService.getServiceHealth('users'),
      await this.proxyService.getServiceHealth('products'),
      await this.proxyService.getServiceHealth('checkout'),
      await this.proxyService.getServiceHealth('payments'),
    ])

    return {
      // This reports that the gateway answered, even if a downstream is down.
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: { users, products, checkout, payments },
    }
  }

  @Get('hello')
  getHello(): string {
    // Keep the HTTP handler focused on delegation to the application service.
    return this.appService.getHello()
  }
}
