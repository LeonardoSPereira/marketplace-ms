import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'

import { AuthResponseDto } from '../dtos/auth-response.dto.js'
import { LoginDto } from '../dtos/login.dto.js'
import { RegisterDto } from '../dtos/register.dto.js'
import { AuthService } from '../services/auth.service.js'

// Expose auth requests while AuthService owns downstream calls and failures.
// Input DTOs drive validation; response DTOs keep Swagger schemas reusable.
// Explicit response types retain schemas with this ESM build and CLI plugin.
// Response annotations do not validate downstream response bodies.
@ApiTags('Authentication')
@ApiBadRequestResponse({ description: 'Request body failed DTO validation' })
@ApiTooManyRequestsResponse({ description: 'Request limit exceeded' })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate a user and return access and session tokens with user details',
  })
  @ApiOkResponse({ description: 'Login successful', type: AuthResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or users-service request failed',
  })
  // Override the short window; other configured windows still participate.
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    const response = await this.authService.login(loginDto)

    return response
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register user',
    description: 'Create a new user account',
  })
  // No response DTO until the downstream registration contract is defined.
  @ApiCreatedResponse({ description: 'Registration successful' })
  @ApiUnauthorizedResponse({ description: 'Users-service registration failed' })
  // Override the medium window; custom guard keys do not isolate named windows.
  @Throttle({ medium: { limit: 3, ttl: 60_000 } })
  async register(@Body() registerDto: RegisterDto): Promise<unknown> {
    const response = await this.authService.register(registerDto)

    return response
  }
}
