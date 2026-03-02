/**
 * Rate limiter for Anthropic API requests
 * Implements exponential backoff and request queuing
 */

interface RateLimitState {
  requestsInMinute: number;
  lastResetTime: number;
  retryAfter: number;
}

const MAX_TOKENS_PER_MINUTE = 30_000;
const MAX_REQUESTS_PER_MINUTE = 100; // Safety limit

class RateLimiter {
  private state: RateLimitState = {
    requestsInMinute: 0,
    lastResetTime: Date.now(),
    retryAfter: 0,
  };

  private requestQueue: Array<{
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  private isProcessing = false;

  /**
   * Track an API request and manage rate limiting
   */
  async executeWithRateLimit<T>(
    fn: () => Promise<T>,
    estimatedTokens: number = 1000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceReset = now - this.state.lastResetTime;

      // Reset counter if a minute has passed
      if (timeSinceReset > 60_000) {
        this.state.requestsInMinute = 0;
        this.state.lastResetTime = now;
        this.state.retryAfter = 0;
      }

      // Check if we're rate limited
      if (this.state.retryAfter > now) {
        const waitTime = this.state.retryAfter - now;
        console.log(`Rate limited: waiting ${Math.ceil(waitTime / 1000)}s`);
        await this.sleep(Math.min(waitTime, 2000)); // Max 2s sleep per iteration
        continue;
      }

      // Check request count
      if (this.state.requestsInMinute >= MAX_REQUESTS_PER_MINUTE) {
        const timeUntilReset = 60_000 - timeSinceReset;
        this.state.retryAfter = now + timeUntilReset;
        console.log(`Max requests reached: waiting until next minute`);
        await this.sleep(1000);
        continue;
      }

      const { fn, resolve, reject } = this.requestQueue.shift()!;

      try {
        this.state.requestsInMinute++;
        const result = await fn();
        resolve(result);

        // Small delay between requests to avoid hammering the API
        await this.sleep(100);
      } catch (error: any) {
        if (error.status === 429) {
          // Rate limit error - extract retry-after header if available
          const retryAfterHeader = error.headers?.["retry-after"];
          const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader) : 60;

          this.state.retryAfter = Date.now() + (retryAfterSeconds * 1000);
          console.error(
            `429 Rate Limited: Retry after ${retryAfterSeconds}s`,
            error.error?.error?.message
          );

          // Re-queue the request to retry later
          this.requestQueue.unshift({ fn, resolve, reject });

          // Wait before retrying
          await this.sleep(Math.min(retryAfterSeconds * 1000, 5000));
        } else {
          reject(error);
        }
      }
    }

    this.isProcessing = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit status
   */
  getStatus() {
    const now = Date.now();
    const timeSinceReset = now - this.state.lastResetTime;
    const timeUntilReset = Math.max(0, 60_000 - timeSinceReset);

    return {
      requestsInMinute: this.state.requestsInMinute,
      timeUntilResetMs: timeUntilReset,
      isRateLimited: this.state.retryAfter > now,
      retryAfterSeconds: Math.ceil((this.state.retryAfter - now) / 1000),
      queuedRequests: this.requestQueue.length,
    };
  }

  /**
   * Reset rate limiter (useful for testing)
   */
  reset() {
    this.state = {
      requestsInMinute: 0,
      lastResetTime: Date.now(),
      retryAfter: 0,
    };
    this.requestQueue = [];
    this.isProcessing = false;
  }
}

export const rateLimiter = new RateLimiter();
