import { HttpService } from '@nestjs/axios'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { firstValueFrom } from 'rxjs'

import { serviceConfig } from '../../config/gateway.config.js'

// Expected users-service session shape; the HTTP response is not validated.
export interface UserSession {
  valid: boolean
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    status: string
  } | null
}

// Injectable auth boundary: forwards requests to users and verifies JWTs locally.
// Each outbound call uses the users timeout (10 seconds); all caught failures,
// including transport errors, become 401 responses without upstream details.
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService,
  ) {}

  // Verification uses JWT_SECRET from JwtModule; this helper is not an HTTP route.
  async validateJwtToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.verify(token)
      return decoded
    } catch {
      throw new UnauthorizedException('Invalid token')
    }
  }

  async validateSessionToken(sessionToken: string): Promise<UserSession> {
    try {
      // Convert the HTTP Observable into a Promise to await one response.
      const { data } = await firstValueFrom(
        this.httpService.get<UserSession>(
          `${serviceConfig.users.url}/sessions/validate/${sessionToken}`,
          {
            timeout: serviceConfig.users.timeout,
          },
        ),
      )

      return data
    } catch {
      throw new UnauthorizedException('Invalid Session Token')
    }
  }

  // Preserve the users-service response body; the gateway does not issue tokens.
  async login(loginDto: { email: string; password: string }) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${serviceConfig.users.url}/login`, loginDto, {
          timeout: serviceConfig.users.timeout,
        }),
      )

      return data
    } catch {
      throw new UnauthorizedException(
        'No user was found with these credentials',
      )
    }
  }

  // Forward registration unchanged; no gateway DTO rules are applied here.
  async register(registerDto: any) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${serviceConfig.users.url}/auth/register`,
          registerDto,
          {
            timeout: serviceConfig.users.timeout,
          },
        ),
      )

      return data
    } catch {
      throw new UnauthorizedException('Register has failed')
    }
  }
}
