import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

import { AuthService } from '../auth/services/auth.service.js'

// Optional session authentication; not applied to any current route.
// AuthService is exported by AuthModule for injection where this guard is used.
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const sessionToken = request.headers['x-session-token']

    if (!sessionToken) throw new UnauthorizedException()

    try {
      const session = await this.authService.validateSessionToken(sessionToken)

      if (!session.valid || !session.user) {
        throw new UnauthorizedException('Invalid session token')
      }

      // Subsequent guards and parameter decorators can read this user context.
      request.user = session.user

      return true
    } catch {
      throw new UnauthorizedException('Invalid session token')
    }
  }
}
