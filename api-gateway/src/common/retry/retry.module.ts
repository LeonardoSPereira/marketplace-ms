import { Module } from '@nestjs/common'

import { RetryService } from './retry.service.js'

// Export RetryService so importing modules (such as ProxyModule) can inject it.
@Module({
  providers: [RetryService],
  exports: [RetryService],
})
export class RetryModule {}
