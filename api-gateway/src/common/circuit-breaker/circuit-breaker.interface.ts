// Shared circuit states and contracts; interfaces do not validate runtime data.
export enum CircuitBreakerStateEnum {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold: number
  // Milliseconds used only to initialize nextAttemptTime; no operation deadline.
  timeout: number
  // Milliseconds to wait after opening before allowing another attempt.
  resetTimeout: number
}

export interface CircuitBreakerState {
  state: CircuitBreakerStateEnum
  failureCount: number
  lastFailureTime: number
  nextAttemptTime: number
}

// Unused result envelope: execution currently returns operation/fallback data directly.
export interface CircuitBreakerResult<T> {
  success: boolean
  data?: T
  error?: Error
  fromCache?: boolean
}
