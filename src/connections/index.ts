import { prisma } from "./database/prisma";
import { redisClient } from "./redis/redis-client";
import { connectionsRouter } from "./routes";

export {
	getCometWsManager,
	getCometHttpNodeMan,
	getBlockchainApiNodeMan,
	initConnectionsModule,
} from "./init-module"

export {
	// connection clients
	prisma,
	redisClient,
	// defined routers
	connectionsRouter,
};