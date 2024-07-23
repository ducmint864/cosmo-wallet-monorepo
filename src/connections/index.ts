import { WebSocketClientManager } from "./websocket/WebSocketClientManager";
import { prisma } from "./database/prisma";
import { redisClient } from "./redis/redis-client";
import { ChainNodeManager } from "./blockchain/ChainNodeManager";

// Singleton instance of WebSocketClientManager
const webSocketClientManager = WebSocketClientManager.instance;
const chainNodeManager = ChainNodeManager.instance;

export {
	webSocketClientManager,
	prisma,
	redisClient,
};