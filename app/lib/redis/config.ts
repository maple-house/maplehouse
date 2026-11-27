import { Redis } from "ioredis";

const globalForRedis = globalThis as unknown as {
  ioredisClient?: Redis;
};

console.log(process.env.NODE_ENV)

const redis: Redis =
  globalForRedis.ioredisClient ??
  new Redis(process.env.REDIS_URL!, {
    // don't crash on startup if Redis isn't reachable yet — retry instead
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      // exponential backoff, capped at 5s
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
    lazyConnect: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.ioredisClient = redis;
}

redis.on("connect", () => {
  console.info("ioredis: connecting...");
});

redis.on("ready", () => {
  console.info("ioredis: connected and ready");
});

redis.on("error", (err) => {
  console.error(`ioredis error: ${err}`);
});

redis.on("close", () => {
  console.warn("ioredis: connection closed");
});

redis.on("reconnecting", (delay: number) => {
  console.warn(`ioredis: reconnecting in ${delay}ms`);
});

export default redis;