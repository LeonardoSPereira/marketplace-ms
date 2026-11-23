import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { ROLES_KEY } from '@/auth/decorators/roles.decorator.js'

// Optional authorization guard; not applied to current routes. It expects an
// earlier authentication guard to populate request.user when roles are required.
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    )

    // Routes without role metadata pass without checking identity.
    if (!requiredRoles) return true

    const user = context.switchToHttp().getRequest().user

    if (!user || !user.role) throw new ForbiddenException('User not authorized')

    const hasRole = requiredRoles.includes(user.role)

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      )
    }

    return true
  }
}
