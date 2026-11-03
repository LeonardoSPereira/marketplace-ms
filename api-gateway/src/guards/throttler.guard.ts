import { Injectable } from '@nestjs/common'
import {
  ThrottlerException,
  ThrottlerGuard,
  ThrottlerRequest,
} from '@nestjs/throttler'

// Global controller guard registered in AppModule; exceeds a limit with HTTP 429.
// Counter storage uses the default in-memory provider, local to this process.
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // IP plus client-controlled User-Agent identifies a tracker, not a user.
    return `${req.ip}-${req.headers['user-agent']}`
  }

  protected async handleRequest(requestProps: ThrottlerRequest) {
    const { context, limit, ttl } = requestProps

    const { req, res } = this.getRequestResponse(context)

    // @Throttle stores named metadata, not a single 'throttle' object. This
    // lookup therefore falls back to 'default' for the current decorators,
    // sharing a handler's counter across windows instead of isolating names.
    const throttlers = this.reflector.get('throttle', context.getHandler())
    const throttlerName = throttlers ? Object.keys(throttlers)[0] : 'default'

    const tracker = await this.getTracker(req)
    const key = this.generateKey(context, tracker, throttlerName)

    // The base guard resolves each window limit/ttl, but this override ignores
    // its name and blockDuration, passing a fixed 1 ms block duration instead.
    const throttlerStorage = await this.storageService.increment(
      key,
      ttl,
      limit,
      1,
      throttlerName,
    )

    // Check totalHits rather than storage isBlocked; retry/reset headers below
    // report the full configured ttl in seconds, not the actual remaining time.
    if (throttlerStorage.totalHits > limit) {
      res.setHeader('Retry-After', Math.round(ttl / 1000))
      throw new ThrottlerException()
    }

    // All windows write the same headers; later checks overwrite earlier ones.
    res.setHeader(`${this.headerPrefix}-Limit`, limit)
    res.setHeader(`${this.headerPrefix}-Reset`, Math.round(ttl / 1000))
    res.setHeader(
      `${this.headerPrefix}-Remaining`,
      limit - throttlerStorage.totalHits,
    )

    return true
  }
}
