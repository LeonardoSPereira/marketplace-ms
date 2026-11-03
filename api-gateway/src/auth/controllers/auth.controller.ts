import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'

import { AuthService } from '../services/auth.service.js'

// Expose auth requests while AuthService owns downstream calls and failures.
// Inline types and any provide no runtime DTO validation or body schemas.
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  // Override the short window; other configured windows still participate.
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  async login(@Body() loginDto: { email: string; password: string }) {
    const response = await this.authService.login(loginDto)

    return response
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register user' })
  @ApiResponse({ status: 201, description: 'Register successful' })
  // Documentation only: AuthService currently maps all upstream failures to 401.
  @ApiResponse({ status: 400, description: 'Invalid registration data' })
  // Override the medium window; custom guard keys do not isolate named windows.
  @Throttle({ medium: { limit: 3, ttl: 60_000 } })
  async register(@Body() registerDto: any) {
    const response = await this.authService.register(registerDto)

    return response
  }
}
