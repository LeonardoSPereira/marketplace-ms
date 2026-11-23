import { Module } from '@nestjs/common'

import { TimeoutService } from './timeout.service.js'

// Export TimeoutService so importing modules (such as ProxyModule) can inject it.
@Module({
  providers: [TimeoutService],
  exports: [TimeoutService],
})
export class TimeoutModule {}
