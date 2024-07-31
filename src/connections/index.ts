import { CometWsManager } from "./chain-rpc/comet-bft-websocket/CometWsManager";
import { prisma } from "./database/prisma";
import { redisClient } from "./redis/redis-client";
import { ChainNodeManager } from "./chain-rpc/ChainNodeManager";
import { Selector } from "./chain-rpc/selector/Selector";
import { RandomSelector } from "./chain-rpc/selector/RandomSelector";
import { chainRpcConfig } from "../config";

// Init singleton selector
const selector: Selector = new RandomSelector();

// Init singleton ws manager
CometWsManager.init(selector);
const cometWsManager = CometWsManager.instance;

for (const endpoint of chainRpcConfig.cometBftWebSocketEndpoints) {
	try {
		cometWsManager.addClient(endpoint);
	} catch (err) {
		console.error(`Trouble connecting to '${endpoint}': ${err}`);
		process.exit(1);
	}
}

// Init ChainNodeManager singleton instance
const chainNodeManager = ChainNodeManager.instance;

export {
	cometWsManager,
	prisma,
	redisClient,
};