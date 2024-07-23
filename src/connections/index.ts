import { WebSocketClientManager } from "./websocket/WebSocketClientManager";
import { prisma } from "./database/prisma";
import { redisClient } from "./redis/redis-client";

// Singleton instance of WebSocketClientManager
const webSocketClientManager = WebSocketClientManager.instance;

export {
	webSocketClientManager,
	prisma,
	redisClient,
};