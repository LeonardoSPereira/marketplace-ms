import { Injectable, Logger } from '@nestjs/common'

import { RetryOptions, RetryResult } from './retry.interface.js'

// Exponential-backoff retry helper used by ProxyService. All rejections are
// retried unconditionally without checking HTTP method idempotency or status codes.
@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name)
  // Default settings: 1 initial call + up to 3 retries, 1 s base delay, 30 s cap.
  private readonly defaultOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
  }

  // Run up to maxRetries + 1 attempts and return an outcome envelope without throwing.
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {},
  ): Promise<RetryResult<T>> {
    const config = { ...this.defaultOptions, ...options }
    const startTime = Date.now()
    let lastError: Error

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        this.logger.debug(
          `Retry attempt ${attempt + 1}/${config.maxRetries + 1}`,
        )

        const data = await operation()
        const totalTime = Date.now() - startTime

        this.logger.log(
          `Operation succeeded on attempt ${attempt + 1} in ${totalTime}ms`,
        )

        return {
          success: true,
          data,
          attempts: attempt + 1,
          totalTime,
        }
      } catch (error) {
        lastError = error as Error
        this.logger.warn(
          `Attempt ${attempt + 1} failed: ${lastError.message || 'Unknown error'}`,
        )

        if (attempt < config.maxRetries) {
          const delay = this.calculateDelay(attempt, config)
          this.logger.debug(`Waiting ${delay}ms before retry`)
          await this.delay(delay)
        }
      }
    }

    const totalTime = Date.now() - startTime
    this.logger.error(
      `All ${config.maxRetries + 1} attempts failed in ${totalTime}ms`,
    )

    return {
      success: false,
      error: lastError!,
      attempts: config.maxRetries + 1,
      totalTime,
    }
  }

  private calculateDelay(attempt: number, options: RetryOptions): number {
    let delay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt)

    // Scale the exponential delay to [0.5x, 1.0x) to spread concurrent retries.
    if (options.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }

    return Math.min(delay, options.maxDelay)
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Unwrap executeWithRetry for callers (such as ProxyService) that expect a value or thrown Error.
  async executeWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    const result = await this.executeWithRetry(operation, { maxRetries })

    if (!result.success) {
      throw result.error
    }

    return result.data!
  }
}
