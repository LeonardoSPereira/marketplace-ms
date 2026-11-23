import { ApiProperty } from '@nestjs/swagger'

import { UserResponseDto } from './user-response.dto.js'

// Login response schema referenced by the controller and outbound HTTP typing.
// These fields describe the contract; no response validation or mapping runs.
export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token returned by the users service',
  })
  accessToken: string

  @ApiProperty({ description: 'Session token returned by the users service' })
  sessionToken: string

  // The downstream contract has not specified a unit; no conversion occurs here.
  @ApiProperty({ description: 'Token lifetime returned by the users service' })
  expiresIn: number

  @ApiProperty({ type: () => UserResponseDto })
  user: UserResponseDto
}
