import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'roles'

// Attach allowed roles for RoleGuard to read; metadata alone enforces nothing.
// No current handler uses it.
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)
