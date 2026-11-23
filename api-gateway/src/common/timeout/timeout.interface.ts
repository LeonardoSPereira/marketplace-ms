// Options for TimeoutService.executeWithTimeout; timeout and maxBackoff are in
// milliseconds. ProxyService uses executeWithCustomTimeout instead of these options.
export interface TimeoutOptions {
  timeout: number
  retries: number
  backoffMultiplier: number
  maxBackoff: number
}
