import { Injectable, Logger } from '@nestjs/common'

import {
  CircuitBreakerOptions,
  CircuitBreakerState,
  CircuitBreakerStateEnum,
} from './circuit-breaker.interface.js'

// In-memory circuit registry used by the internal proxy helper only. Auth calls
// and health probes bypass it; state is lost on restart and is not shared by replicas.
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name)
  private readonly circuits = new Map<string, CircuitBreakerState>()
  private readonly defaultOptions: CircuitBreakerOptions = {
    failureThreshold: 5,
    timeout: 60_000, // 60 seconds
    resetTimeout: 30_000, // 30 seconds
  }

  // Execute once or use the supplied fallback; this method never retries.
  // Every rejected operation counts, including upstream HTTP client errors.
  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T>,
    key: string,
    options: CircuitBreakerOptions = this.defaultOptions,
  ) {
    const config = { ...this.defaultOptions, ...options }
    const circuit = this.getOrCreateCircuit(key, config)

    if (circuit.state === CircuitBreakerStateEnum.OPEN) {
      const now = Date.now()

      if (now < circuit.nextAttemptTime) {
        this.logger.warn(
          `Circuit Breaker is ${CircuitBreakerStateEnum.OPEN} for key: ${key}, using fallback`,
        )

        if (fallback) {
          const result = await fallback()
          return result
        }

        throw new Error(`Circuit Breaker ${CircuitBreakerStateEnum.OPEN}`)
      }

      // No lock limits half-open attempts: concurrent callers can all proceed.
      circuit.state = CircuitBreakerStateEnum.HALF_OPEN
      this.logger.warn(
        `Circuit Breaker is ${CircuitBreakerStateEnum.HALF_OPEN} for key: ${key}`,
      )
    }

    try {
      const result = await operation()
      this.onSuccess(circuit, key)

      return result
    } catch (error: Error | unknown) {
      this.onFailure(circuit, key, config)

      this.logger.error(
        `Circuit Breaker operation failed for key: ${key}, error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )

      // Fallback errors propagate; a fallback success does not close the circuit.
      if (fallback) {
        this.logger.log(`Executing fallback for key: ${key}`)
        const result = await fallback()
        return result
      }

      throw error
    }
  }

  private getOrCreateCircuit(
    key: string,
    options: CircuitBreakerOptions,
  ): CircuitBreakerState {
    const hasCircuit = this.circuits.has(key)

    if (!hasCircuit) {
      this.circuits.set(key, {
        state: CircuitBreakerStateEnum.CLOSED,
        failureCount: 0,
        lastFailureTime: 0,
        // Ignored while CLOSED; opening replaces this with resetTimeout.
        // No timer races or cancels the operation itself.
        nextAttemptTime: Date.now() + options.timeout,
      })
    }

    return this.circuits.get(key)!
  }

  private onSuccess(circuit: CircuitBreakerState, key: string): void {
    circuit.failureCount = 0
    circuit.state = CircuitBreakerStateEnum.CLOSED
    this.logger.debug(
      `Circuit breaker SUCCESS for ${key}, state: ${CircuitBreakerStateEnum.CLOSED}`,
    )
  }

  private onFailure(
    circuit: CircuitBreakerState,
    key: string,
    options: CircuitBreakerOptions,
  ): void {
    circuit.failureCount++
    circuit.lastFailureTime = Date.now()

    if (circuit.failureCount >= options.failureThreshold) {
      circuit.state = CircuitBreakerStateEnum.OPEN
      circuit.nextAttemptTime = Date.now() + options.resetTimeout
      this.logger.warn(
        `Circuit breaker ${CircuitBreakerStateEnum.OPEN} for ${key} after ${circuit.failureCount} failures`,
      )
    }
  }

  // Inspection helpers are not HTTP endpoints. Returned state objects remain
  // mutable references; getAllCircuits copies the map but not its state values.
  getCircuitState(key: string): CircuitBreakerState | undefined {
    return this.circuits.get(key)
  }

  getAllCircuits(): Map<string, CircuitBreakerState> {
    return new Map(this.circuits)
  }

  resetCircuit(key: string): void {
    this.circuits.delete(key)
    this.logger.log(`Circuit breaker RESET for ${key}`)
  }
}
