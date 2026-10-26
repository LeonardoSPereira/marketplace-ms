import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'

import { ProxyService } from './service/proxy.service.js'

@Module({
  imports: [HttpModule], // Provides Nest's Axios-backed HttpService.
  providers: [ProxyService],
  // Importing modules can inject this same provider through Nest's container.
  exports: [ProxyService],
})
export class ProxyModule {}
