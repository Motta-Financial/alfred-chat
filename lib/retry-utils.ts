/**
 * Retry utility with exponential backoff
 * Based on OpenAI Cookbook function calling best practices
 */

export interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  multiplier?: number
}

export async function retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxAttempts = 3, initialDelay = 1000, maxDelay = 40000, multiplier = 2 } = options

  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[v0] Attempt ${attempt}/${maxAttempts}`)
      return await fn()
    } catch (error) {
      lastError = error as Error
      console.error(`[v0] Attempt ${attempt} failed:`, error)

      if (attempt === maxAttempts) {
        console.error(`[v0] All ${maxAttempts} attempts failed`)
        break
      }

      // Calculate delay with exponential backoff and jitter
      const baseDelay = Math.min(initialDelay * Math.pow(multiplier, attempt - 1), maxDelay)
      const jitter = Math.random() * 0.3 * baseDelay // Add up to 30% jitter
      const delay = baseDelay + jitter

      console.log(`[v0] Waiting ${Math.round(delay)}ms before retry...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
    return true
  }

  // HTTP status codes that should be retried
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504]
  if (error.response && retryableStatusCodes.includes(error.response.status)) {
    return true
  }

  return false
}

/**
 * Retry only if error is retryable
 */
export async function retryIfRetryable<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  return retryWithBackoff(async () => {
    try {
      return await fn()
    } catch (error) {
      if (!isRetryableError(error)) {
        console.log("[v0] Error is not retryable, throwing immediately")
        throw error
      }
      throw error
    }
  }, options)
}
