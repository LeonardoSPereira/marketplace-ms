import { Injectable, Logger } from '@nestjs/common'

// Factories return deferred async fallbacks. The proxy uses createErrorFallback;
// the other factories are currently unused and do not validate response shapes.
@Injectable()
export class DefaultFallbackService {
  private readonly logger = new Logger(DefaultFallbackService.name)

  createDefaultFallback<T>(
    defaultResponse: T,
    serviceName: string,
  ): () => Promise<T> {
    const self = async (): Promise<T> => {
      this.logger.warn(`Using default fallback for ${serviceName}`)

      return defaultResponse
    }

    return self
  }

  // Throw a plain Error; this is not a Nest HTTP status/exception mapping.
  createErrorFallback(
    serviceName: string,
    errorMessage: string,
  ): () => Promise<never> {
    const self = async (): Promise<never> => {
      this.logger.error(`Fallback error for ${serviceName}: ${errorMessage}`)
      throw new Error(`${serviceName} service unavailable: ${errorMessage}`)
    }

    return self
  }

  createEmptyArrayFallback<T>(serviceName: string): () => Promise<T[]> {
    const self = async (): Promise<T[]> => {
      this.logger.warn(`Using empty array fallback for ${serviceName}`)

      return []
    }

    return self
  }

  createEmptyObjectFallback<T>(serviceName: string): () => Promise<T> {
    const self = async (): Promise<T> => {
      this.logger.warn(`Using empty object fallback for ${serviceName}`)

      return {} as T
    }

    return self
  }
}
