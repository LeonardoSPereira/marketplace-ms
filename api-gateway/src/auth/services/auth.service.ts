import { HttpService } from '@nestjs/axios'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { firstValueFrom } from 'rxjs'

import { Role } from '../../common/dtos/role.dto.js'
import { serviceConfig } from '../../config/gateway.config.js'
import { AuthResponseDto } from '../dtos/auth-response.dto.js'
import { LoginDto } from '../dtos/login.dto.js'
import { RegisterDto } from '../dtos/register.dto.js'

// Expected users-service session shape; the HTTP response is not validated.
export interface UserSession {
  valid: boolean
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: Role
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
  // The return annotation does not validate decoded claims against the login DTO.
  async validateJwtToken(token: string): Promise<AuthResponseDto> {
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
  // The HTTP generic provides compile-time typing, not runtime schema validation.
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<AuthResponseDto>(
          `${serviceConfig.users.url}/login`,
          loginDto,
          { timeout: serviceConfig.users.timeout },
        ),
      )

      return data
    } catch {
      throw new UnauthorizedException(
        'No user was found with these credentials',
      )
    }
  }

  // Forward validated registration input; the downstream response shape is unspecified.
  async register(registerDto: RegisterDto): Promise<unknown> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<unknown>(
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
