import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

// Request contract: the global ValidationPipe checks email and password rules.
// ApiProperty supplies Swagger examples; class-validator enforces constraints.
export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'email@example.com',
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
}
