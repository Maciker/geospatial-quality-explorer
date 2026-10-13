type Window = { startedAtMs: number; count: number };

export type RateDecision = { readonly allowed: true } | { readonly allowed: false; readonly retryAfterSeconds: number };

/**
 * Best-effort, per-process limiter. Each serverless instance keeps its own windows,
 * so a hosted demo also needs a spend cap at the LLM provider.
 */
export class FixedWindowRateLimiter {
  private readonly windows = new Map<string, Window>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly now: () => number;
  private readonly maxClients: number;

  constructor(options: { limit: number; windowMs: number; now?: () => number; maxClients?: number }) {
    this.limit = options.limit;
    this.windowMs = options.windowMs;
    this.now = options.now ?? Date.now;
    this.maxClients = options.maxClients ?? 10_000;
  }

  take(clientKey: string): RateDecision {
    const now = this.now();
    const current = this.windows.get(clientKey);
    if (!current || now - current.startedAtMs >= this.windowMs) {
      this.evictWhenFull();
      this.windows.set(clientKey, { startedAtMs: now, count: 1 });
      return { allowed: true };
    }
    if (current.count >= this.limit) {
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.startedAtMs + this.windowMs - now) / 1000)) };
    }
    current.count += 1;
    return { allowed: true };
  }

  private evictWhenFull(): void {
    if (this.windows.size < this.maxClients) return;
    const oldest = this.windows.keys().next().value;
    if (oldest !== undefined) this.windows.delete(oldest);
  }
}
