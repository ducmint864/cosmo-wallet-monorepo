import { CometWsManager } from "./chain-rpc/comet-bft-websocket/CometWsManager";
import { prisma } from "./database/prisma";
import { redisClient } from "./redis/redis-client";
import { HttpNodeManager } from "./chain-rpc/http/HttpNodeManager";
import { CometHttpManager } from "./chain-rpc/http/comet-bft-http/CometHttpManager";
import { RpcRestManager } from "./chain-rpc/http/REST/RpcRestManager";
import { Selector } from "./chain-rpc/selector/Selector";
import { RandomSelector } from "./chain-rpc/selector/RandomSelector";
import { chainRpcConfig } from "../config";

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
CometHttpManager.init();
const cometHttpManager = CometHttpManager.instance;
registerHttpNodes(
	cometHttpManager,
	...chainRpcConfig.http.cometBftHttp.endpoints
);

// Init RpcRestManager singleton instance
RpcRestManager.init();
const rpcRestManager = RpcRestManager.instance;
registerHttpNodes(
	rpcRestManager,
	...chainRpcConfig.http.rpcRest.endpoints
);

function registerHttpNodes(manager: HttpNodeManager, ...endpoints: string[]): void {
	for (const endpoint of endpoints) {
		try {
			manager.registerNode(endpoint);
		} catch (err) {
			console.error(`Trouble registering http node '${endpoint}':`, err);
			process.exit(1);
		}
	}
}

export {
	prisma,
	redisClient,
	cometWsManager,
	cometHttpManager,
	rpcRestManager,
};
