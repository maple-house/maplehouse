import { Redis } from "ioredis";
import logger from "../logger/config";

const globalForRedis = globalThis as unknown as {
  ioredisClient?: Redis;
};

const redis: Redis =
  globalForRedis.ioredisClient ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
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
  logger.info("ioredis: connecting...");
});

redis.on("ready", () => {
  logger.info("ioredis: connected and ready");
});

redis.on("error", (err) => {
  logger.error(`ioredis error: ${err}`);
});

redis.on("close", () => {
  logger.warn("ioredis: connection closed");
});

redis.on("reconnecting", (delay: number) => {
  logger.warn(`ioredis: reconnecting in ${delay}ms`);
});

export default redis;