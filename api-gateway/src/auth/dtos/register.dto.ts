import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

import { Role } from '@/common/dtos/role.dto.js'

// Registration request contract: validators enforce input rules and ApiProperty
// supplies Swagger metadata. String checks do not require nonempty names.
export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string

  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  firstName: string

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsString()
  lastName: string

  @ApiProperty({
    description: 'User role',
    example: 'user',
    enum: Role,
    enumName: 'Role',
    required: false,
  })
  // Missing roles default to user during transformation. The Swagger enum
  // documents allowed roles, but IsString does not enforce enum membership.
  // IsOptional also skips checks for null, which does not select this default.
  @IsOptional()
  @IsString()
  role?: Role = Role.USER
}
