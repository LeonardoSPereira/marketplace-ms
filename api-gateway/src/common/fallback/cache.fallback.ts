import { Injectable, Logger } from '@nestjs/common'

// Process-local fallback cache, populated by successful proxy GETs. Expiry is
// checked only on reads; there is no background eviction or size bound.
@Injectable()
export class CacheFallbackService {
  private readonly logger = new Logger(CacheFallbackService.name)
  private readonly cache = new Map<
    string,
    { data: unknown; timestamp: number }
  >()

  // timeout is the maximum cached age in milliseconds (five minutes by default).
  // The generic casts stored data; it does not validate or clone the value.
  async getCachedData<T>(
    key: string,
    timeout: number = 300_000,
  ): Promise<T | null> {
    const cached = this.cache.get(key)

    if (!cached) {
      return null
    }

    const isExpired = Date.now() - cached.timestamp > timeout
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    this.logger.log(`Cache hit for key: ${key}`)
    return cached.data as T
  }

  setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
    this.logger.log(`Cache set for key: ${key}`)
  }

  createCacheFallback<T>(
    key: string,
    defaultData: T,
    timeout: number = 300_000,
  ): () => Promise<T> {
    const self = async () => {
      const cached = await this.getCachedData<T>(key, timeout)

      // Falsy cached values (false, 0, empty string, null) select defaultData.
      if (cached) {
        this.logger.log(`Using cached data for key: ${key}`)
        return cached
      }

      this.logger.log(`No cached data for key: ${key}, returning default data`)
      return defaultData
    }

    return self
  }
}
