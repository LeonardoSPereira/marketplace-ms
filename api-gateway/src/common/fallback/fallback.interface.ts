// Design contracts only: the providers return callbacks and do not consume these
// options. retryCount/retryDelay do not enable retries; time fields are milliseconds.
export interface FallbackStrategy<T> {
  execute(): Promise<T>
}

export interface FallbackOptions {
  useCache?: boolean
  cacheTimeout?: number
  defaultResponse?: unknown
  retryCount?: number
  retryDelay?: number
}
