import { createClient } from "redis";

export const redisClient = createClient();

// Connect
(async () => {
	await redisClient.connect();
}) ();

// For less complex use cases, one redis client is prolly sufficient
redisClient.on('error', (err) => console.log('Redis Client Error', err));
