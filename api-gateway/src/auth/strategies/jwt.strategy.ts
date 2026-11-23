import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { AuthService } from '@/auth/services/auth.service.js'
import { Role } from '@/common/dtos/role.dto.js'

interface JwtPayload {
  sub: string
  email: string
  role: Role
  token: string
  iat?: number
  exp?: number
}

// Inactive until registered as a provider and invoked by a JWT guard.
// Passport verifies the bearer token signature and expiration before validate.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || '',
    })
  }

  async validate(payload: JwtPayload) {
    if (!payload) throw new UnauthorizedException('Invalid token payload')

    // This implementation additionally expects a nested JWT in payload.token.
    // Returned request.user fields come from the outer payload, not this result.
    const user = await this.authService.validateJwtToken(payload.token)

    if (!user) throw new UnauthorizedException()

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    }
  }
}
