import { Module } from '@nestjs/common'

import { CacheFallbackService } from '@/common/fallback/cache.fallback.js'
import { DefaultFallbackService } from '@/common/fallback/default.fallback.js'

// Share fallback providers through DI; importing this module exposes no routes.
@Module({
  providers: [CacheFallbackService, DefaultFallbackService],
  exports: [CacheFallbackService, DefaultFallbackService],
})
export class FallbackModule {}
