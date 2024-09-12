import { createClient } from "redis";
import { appLogger } from "../../logs";

export const redisClient = createClient();

// Connect
(async () => {
	await redisClient.connect();
}) ();

// For less complex use cases, one redis client is prolly sufficient
redisClient.on('error', (err) => appLogger.error('Redis Client Error', err));
