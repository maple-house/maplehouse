/**
 * Token bucket rate limiter. Storage-agnostic via the RateLimitStore
 * interface — swap the in-memory Map for Redis/Upstash in production;
 * in-memory only works correctly on a single instance and resets on
 * restart/redeploy.
 *
 * Use this in front of BOTH your OTP-send endpoint and your QR-poll/
 * verify endpoint — these are exactly the routes that create sessions
 * and are the highest-value brute-force targets in your flow.
 */

interface Bucket {
  tokens: number;
  lastRefill: number; // ms epoch
}

export interface RateLimitStore {
  get(key: string): Promise<Bucket | undefined> | Bucket | undefined;
  set(key: string, bucket: Bucket): Promise<void> | void;
}

export function createMemoryStore(): RateLimitStore {
  const map = new Map<string, Bucket>();
  return {
    get: (key) => map.get(key),
    set: (key, bucket) => {
      map.set(key, bucket);
    },
  };
}

/**
 * Redis-backed store — use this one. You already have Redis for sessions,
 * and rate limiting is the other place an in-memory Map quietly breaks:
 * every serverless invocation or extra instance gets its own Map, so a
 * memory-store limiter effectively multiplies your real limit by however
 * many instances are running.
 *
 * Implemented as a Lua script so the read-refill-check-write sequence is
 * atomic — without that, two concurrent requests can both read the same
 * bucket state and both be allowed through, which is exactly the race a
 * rate limiter exists to prevent.
 */
const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

local bucket = redis.call("HMGET", key, "tokens", "last_refill")
local tokens = tonumber(bucket[1])
local last_refill = tonumber(bucket[2])

if tokens == nil then
  tokens = capacity
  last_refill = now
end

local elapsed = math.max(0, (now - last_refill) / 1000)
tokens = math.min(capacity, tokens + elapsed * refill_rate)

local allowed = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
end

redis.call("HMSET", key, "tokens", tokens, "last_refill", now)
-- Let the key expire on its own well after the bucket would fully refill,
-- so idle keys don't accumulate in Redis forever.
local ttl = math.ceil(capacity / refill_rate) * 2
redis.call("EXPIRE", key, ttl)

return { allowed, tostring(tokens) }
`;

export function createRedisStore(redis: {
  eval: (script: string, numKeys: number, ...args: (string | number)[]) => Promise<unknown>;
}): {
  consume: (
    key: string,
    capacity: number,
    refillRatePerSecond: number,
    cost: number
  ) => Promise<{ allowed: boolean; remaining: number }>;
} {
  return {
    async consume(key, capacity, refillRatePerSecond, cost) {
      const result = (await redis.eval(
        TOKEN_BUCKET_SCRIPT,
        1,
        key,
        capacity,
        refillRatePerSecond,
        cost,
        Date.now()
      )) as [number, string];
      return { allowed: result[0] === 1, remaining: parseFloat(result[1]) };
    },
  };
}

export interface RateLimiterOptions {
  capacity: number; // max tokens (burst size)
  refillRatePerSecond: number; // steady-state allowed rate
  store?: RateLimitStore;
}

export function createRateLimiter(opts: RateLimiterOptions) {
  const store = opts.store ?? createMemoryStore();

  /**
   * key should identify the thing being protected — e.g. `otp:${phoneNumber}`
   * or `otp:ip:${ip}`. Use BOTH keyed on phone number and keyed on IP in
   * front of the same route: phone-number keying stops someone hammering
   * one victim's number from many IPs, IP keying stops someone hammering
   * many numbers from one IP.
   */
  async function consume(
    key: string,
    cost = 1
  ): Promise<{ allowed: boolean; remaining: number; retryAfterMs?: number }> {
    const now = Date.now();
    const existing = await store.get(key);

    const bucket: Bucket = existing ?? {
      tokens: opts.capacity,
      lastRefill: now,
    };

    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    const refill = elapsedSeconds * opts.refillRatePerSecond;
    bucket.tokens = Math.min(opts.capacity, bucket.tokens + refill);
    bucket.lastRefill = now;

    if (bucket.tokens < cost) {
      await store.set(key, bucket);
      const deficit = cost - bucket.tokens;
      const retryAfterMs = (deficit / opts.refillRatePerSecond) * 1000;
      return { allowed: false, remaining: bucket.tokens, retryAfterMs };
    }

    bucket.tokens -= cost;
    await store.set(key, bucket);
    return { allowed: true, remaining: bucket.tokens };
  }

  return { consume };
}

/**
 * Wiring example against your Redis instance (this is the one to actually
 * use — createRateLimiter/createMemoryStore above are the single-instance
 * fallback if you ever run without Redis, e.g. in a local script):
 *
 *   import { redis } from "./redis";
 *   const store = createRedisStore(redis);
 *   const otpLimiter = { consume: (key: string) =>
 *     store.consume(key, 5, 5 / 60, 1) }; // capacity 5, refill 5/min
 *
 *   const byPhone = await otpLimiter.consume(`otp:phone:${phoneNumber}`);
 *   const byIp = await otpLimiter.consume(`otp:ip:${ip}`);
 *   if (!byPhone.allowed || !byIp.allowed) {
 *     return new Response("Too many requests", { status: 429 });
 *   }
 */