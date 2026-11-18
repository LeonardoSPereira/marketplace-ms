// Compile-time retry contracts; delay and totalTime fields are milliseconds.
// maxRetries counts additional attempts after the initial call (maxRetries + 1 total).
export interface RetryOptions {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitter: boolean
}

// Outcome envelope returned by executeWithRetry; executeWithExponentialBackoff
// unwraps data on success or rethrows error when all attempts fail.
export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalTime: number
}
