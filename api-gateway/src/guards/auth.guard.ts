import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport'
import { Observable } from 'rxjs'

import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator.js'
import { Role } from '../common/dtos/role.dto.js'

interface JwtUser {
  userId: string
  email: string
  role: Role
}

const JwtGuard = PassportAuthGuard('jwt')

// Optional Passport JWT guard; no current controller or global provider uses it.
// Public metadata bypasses this guard only, leaving other guards unaffected.
@Injectable()
export class JwtAuthGuard extends JwtGuard {
  constructor(private reflector: Reflector) {
    super()
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Handler metadata takes precedence over controller metadata.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) return true

    return super.canActivate(context)
  }

  handleRequest<TUser = JwtUser>(
    err: Error | null,
    user: TUser | false,
    _info: unknown,
    _context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException()
    }

    return user
  }
}
