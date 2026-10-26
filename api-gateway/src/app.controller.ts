import { Controller, Get } from '@nestjs/common'

import { AppService } from './app.service.js'
import { ProxyService } from './proxy/service/proxy.service.js'

@Controller('health')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly proxyService: ProxyService,
  ) {}

  @Get()
  async getHealth() {
    const [users, products, checkout, payments] = await Promise.all([
      await this.proxyService.getServiceHealth('users'),
      await this.proxyService.getServiceHealth('products'),
      await this.proxyService.getServiceHealth('checkout'),
      await this.proxyService.getServiceHealth('payments'),
    ])

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: { users, products, checkout, payments },
    }
  }

  @Get('hello')
  getHello(): string {
    return this.appService.getHello()
  }
}
