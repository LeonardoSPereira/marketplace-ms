import type { ExecutionContext } from '@nestjs/common'
import { createParamDecorator } from '@nestjs/common'

// Read request.user set by authentication; this decorator does not validate it.
// No current handler uses it.
export const CurrentUser = createParamDecorator(
  (_data: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  },
)
