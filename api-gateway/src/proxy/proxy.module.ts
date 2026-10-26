import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'

import { ProxyService } from './service/proxy.service.js'

@Module({
  imports: [HttpModule],
  providers: [ProxyService],
  exports: [ProxyService],
})
export class ProxyModule {}
