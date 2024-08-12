import { CometWsManager } from "./chain-rpc/comet-bft-websocket/types/CometWsManager";
import { prisma } from "./database/prisma";
import { redisClient } from "./redis/redis-client";
import { HttpNodeManager } from "./chain-rpc/http/types/HttpNodeManager";
import { HttpNodeManagerError, HttpNodeManagerErrorCode } from "./chain-rpc/http/types/HttpNodeManagerError"
import { CometHttpNodeManager } from "./chain-rpc/http/comet-bft-http/types/CometHttpNodeManager";
import { BlockchainApiNodeManager } from "./chain-rpc/http/blockchain-app-api/types/BlockchainApiNodeManager";
import { Selector } from "./chain-rpc/types/Selector";
import { RandomSelector } from "./chain-rpc/types/RandomSelector";
import { chainRpcConfig } from "../config";
import { manageRouter } from "./manage";
import { Router } from "express";

// Init singleton selector
const selector: Selector = new RandomSelector();

// Init singleton ws manager
CometWsManager.init(selector);
const cometWsManager = CometWsManager.instance;

for (const endpoint of chainRpcConfig.cometBftWebSocket.endpoints) {
	try {
		cometWsManager.addClient(endpoint);
	} catch (err) {
		console.error(`Trouble connecting to '${endpoint}': ${err}`);
		process.exit(1);
	}
}

// Init CometHttpManager singleton instance
CometHttpNodeManager.init(selector);
const cometHttpNodeMan = CometHttpNodeManager.instance;
registerHttpNodes(
	cometHttpNodeMan,
	...chainRpcConfig.http.cometBftHttp.endpoints
).then();

// Init RpcRestManager singleton instance
BlockchainApiNodeManager.init(selector);
const blockchainApiNodeMan = BlockchainApiNodeManager.instance;
registerHttpNodes(
	blockchainApiNodeMan,
	...chainRpcConfig.http.rpcRest.endpoints
).then();

async function registerHttpNodes(manager: HttpNodeManager, ...endpoints: string[]): Promise<void> {
	for (const endpoint of endpoints) {
		try {
			await manager.registerNode(endpoint);
		} catch (err) {
			if (err instanceof HttpNodeManagerError &&
				err.code === HttpNodeManagerErrorCode.ERR_ALREADY_REGISTERED) {
				console.error(`Skip registered endpoint: ${endpoint}`);
			} else {
				console.error(`Trouble registering http node '${endpoint}':`, err);
				process.exit(1);
			}
		}
	}
}

// Define module-level router for connections module
const connectionsRouter = Router();
connectionsRouter.use("/manage", manageRouter);
connectionsRouter.use("/health", (req, res, next) => res.send("Im alive"));

export {
	prisma,
	redisClient,
	cometWsManager,
	cometHttpNodeMan,
	blockchainApiNodeMan,
	connectionsRouter,
};