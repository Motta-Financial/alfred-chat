type QueuedRequest = {
  fn: () => Promise<any>
  resolve: (value: any) => void
  reject: (error: any) => void
}

class RateLimiter {
  private queue: QueuedRequest[] = []
  private processing = false
  private lastRequestTime = 0
  private minInterval: number

  constructor(requestsPerSecond: number) {
    this.minInterval = 1000 / requestsPerSecond + 100 // Add 100ms buffer
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject })
      setTimeout(() => this.processQueue(), 0)
    })
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime

      if (timeSinceLastRequest < this.minInterval) {
        const waitTime = this.minInterval - timeSinceLastRequest
        console.log(`[v0] Rate limiter waiting ${waitTime}ms before next request`)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }

      const request = this.queue.shift()
      if (!request) break

      this.lastRequestTime = Date.now()

      try {
        const result = await request.fn()
        request.resolve(result)
      } catch (error) {
        request.reject(error)
      }
    }

    this.processing = false

    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 0)
    }
  }
}

// Brave Search free tier: 1 request per second
export const braveSearchLimiter = new RateLimiter(1)
