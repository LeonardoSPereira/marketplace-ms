import { ApiProperty } from '@nestjs/swagger'

import { Role } from '@/common/dtos/role.dto.js'

// Nested Swagger model for public login user fields. Omitting passwords here
// documents the contract; it does not strip fields from the downstream response.
export class UserResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty({ example: 'user@example.com' })
  email: string

  @ApiProperty({ example: 'John' })
  firstName: string

  @ApiProperty({ example: 'Doe' })
  lastName: string

  @ApiProperty({ enum: Role, enumName: 'Role' })
  role: Role
}
