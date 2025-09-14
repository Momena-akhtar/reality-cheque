import Redis from "ioredis";

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });

    redisClient.on("error", (err) => {
      console.error("Redis error:", err);
    });

    redisClient.on("connect", () => {
      console.log("Redis connected");
    });

    redisClient.on("reconnecting", () => {
      console.log("Redis reconnecting...");
    });
  }

  return redisClient;
};

export const connectRedis = async (): Promise<void> => {
  const client = getRedisClient();
  if (client.status === "ready" || client.status === "connecting") return;
  await client.connect();
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log("Redis disconnected");
    } catch (err) {
      console.error("Error disconnecting Redis:", err);
    }
  }
};

export const storeOTP = async (to: string, otp: string) => {
  try {
      const redisClient = getRedisClient();
      await redisClient.set(`otp:${to}`, otp, "EX", 60 * 5);
      if (process.env.NODE_ENV !== "test") {
          console.log(`OTP ${otp} stored for user: ${to}`);
      }
  } catch (err) {
      console.error("Error storing OTP in redis:", err);
  }
};

export const getOTP = async (to: string): Promise<string | null> => {
  try {
      const redisClient = getRedisClient();
      return await redisClient.get(`otp:${to}`);
  } catch (err) {
      console.error("Error retrieving OTP from redis:", err);
      return null;
  }
};

export const removeOTP = async (to: string) => {
  try {
      const redisClient = getRedisClient();
      await redisClient.del(`otp:${to}`);
      if (process.env.NODE_ENV !== "test") {
          console.log(`OTP removed for user: ${to}`);
      }
  } catch (err) {
      console.error("Error removing OTP from redis:", err);
  }
};
