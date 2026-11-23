import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'

// Mark a handler/controller for JwtAuthGuard bypass; unused by current routes.
// Metadata has no effect unless a guard reads it.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
