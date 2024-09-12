import { CometWsManager } from "./chain-rpc/comet-bft-websocket/types/CometWsManager";
import { HttpNodeManager } from "./chain-rpc/http/types/HttpNodeManager";
import { HttpNodeManagerError, HttpNodeManagerErrorCode } from "./chain-rpc/http/types/HttpNodeManagerError"
import { CometHttpNodeManager } from "./chain-rpc/http/comet-bft-http/types/CometHttpNodeManager";
import { BlockchainApiNodeManager } from "./chain-rpc/http/blockchain-app-api/types/BlockchainApiNodeManager";
import { Selector } from "./chain-rpc/types/Selector";
import { RandomSelector } from "./chain-rpc/types/RandomSelector";
import { chainRpcConfig } from "../config";
import { appLogger } from "../logs";

// Define managers
let selector: Selector;
let cometWsManager: CometWsManager;
let cometHttpNodeMan: CometHttpNodeManager;
let blockchainApiNodeMan: BlockchainApiNodeManager;

async function registerHttpNodes(manager: HttpNodeManager, ...endpoints: string[]): Promise<void> {
	for (const endpoint of endpoints) {
		try {
			await manager.registerNode(endpoint);
		} catch (err) {
			if (err instanceof HttpNodeManagerError &&
				err.code === HttpNodeManagerErrorCode.ERR_ALREADY_REGISTERED) {
				appLogger.debug(`Skipped registered http node ${endpoint}`);
			} else {
				appLogger.fatal(`Trouble registering http node '${endpoint}': ${err}`)
				process.exit(1);
			}
		}
	}
}

async function initNodeManagers() {
	appLogger.trace("initNodeModule is called");
	// Init singleton selector
	selector = new RandomSelector();

	// Init singleton ws manager
	CometWsManager.init(selector);
	cometWsManager = CometWsManager.instance;

	for (const endpoint of chainRpcConfig.cometBftWebSocket.endpoints) {
		try {
			cometWsManager.addClient(endpoint);
		} catch (err) {
			appLogger.fatal(`Trouble connecting to node '${endpoint}': ${err}`);
			process.exit(1);
		}
	}

	// Init CometHttpManager singleton instance
	CometHttpNodeManager.init(selector);
	cometHttpNodeMan = CometHttpNodeManager.instance;
	await registerHttpNodes(
		cometHttpNodeMan,
		...chainRpcConfig.http.cometBft.endpoints
	);

	// Init RpcRestManager singleton instance
	BlockchainApiNodeManager.init(selector);
	const blockchainApiNodeMan = BlockchainApiNodeManager.instance;
	await registerHttpNodes(
		blockchainApiNodeMan,
		...chainRpcConfig.http.blockchainApp.endpoints
	);
}

async function getCometWsManager() {
	if (!cometWsManager) {
		await initNodeManagers();
	}
	return cometWsManager;
}

async function getCometHttpNodeMan() {
	if (!cometHttpNodeMan) {
		await initNodeManagers();
	}
	return cometHttpNodeMan;
}

async function getBlockchainApiNodeMan() {
	if (!blockchainApiNodeMan) {
		await initNodeManagers();
	}
	return blockchainApiNodeMan;
}

// export initialized isntances of node managers
export {
	getCometWsManager,
	getCometHttpNodeMan,
	getBlockchainApiNodeMan,
};
