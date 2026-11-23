import { Injectable, Logger } from '@nestjs/common'

import { TimeoutOptions } from './timeout.interface.js'

// Promise.race deadline helper. Losing operations are not aborted by Promise.race,
// and timer handles are not cleared when the operation resolves first.
@Injectable()
export class TimeoutService {
  private readonly logger = new Logger(TimeoutService.name)

  // Defaults for the currently unused executeWithTimeout helper (milliseconds).
  private readonly defaultOptions: TimeoutOptions = {
    timeout: 5_000, // 5 seconds
    retries: 3,
    backoffMultiplier: 2,
    maxBackoff: 30_000,
  }

  // Unused combined timeout-and-retry helper; ProxyService pairs RetryService
  // with executeWithCustomTimeout instead.
  async executeWithTimeout<T>(
    operation: () => Promise<T>,
    options: Partial<TimeoutOptions> = {},
  ): Promise<T> {
    const config = { ...this.defaultOptions, ...options }

    const execution = this.executeWithRetry(operation, config)

    return execution
  }

  // Race a single operation attempt against a rejection timer (timeoutMs in ms).
  async executeWithCustomTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    const self = Promise.race([
      operation(),
      this.createTimeoutPromise(timeoutMs),
    ])

    return self
  }

  // Internal loop for executeWithTimeout. Because the bound is attempt < config.retries,
  // it runs config.retries total attempts (not config.retries + 1 as logged) and
  // still waits for delay after the final failed attempt before throwing.
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: Partial<TimeoutOptions> = {},
  ): Promise<T> {
    const config = { ...this.defaultOptions, ...options }

    let lastError: Error | null = null
    let delay = 1000

    for (let attempt = 0; attempt < config.retries; attempt++) {
      try {
        this.logger.debug(`Attempt ${attempt + 1}/${config.retries + 1}`)

        const result = await Promise.race([
          operation(),
          this.createTimeoutPromise(config.timeout),
        ])

        if (attempt > 0) {
          this.logger.log(`Operation succeeded on attempt ${attempt + 1}`)
        }

        return result as T
      } catch (error) {
        lastError = error as Error
        this.logger.warn(
          `Attempt ${attempt + 1} failed: ${lastError.message || 'Unknown error'}`,
        )

        if (attempt < config.retries) {
          await this.delay(delay)
          delay = Math.min(delay * config.backoffMultiplier, config.maxBackoff)
        }
      }
    }

    this.logger.error(`All ${config.retries + 1} attempts failed`)
    throw lastError || new Error('Unknown Error')
  }

  // Reject after timeout ms; the timer is not cleared if the raced operation settles first.
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`))
      }, timeout)
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
