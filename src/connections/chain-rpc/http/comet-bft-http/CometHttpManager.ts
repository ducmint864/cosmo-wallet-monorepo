import {
	HttpNodeManagerError,
	HttpNodeManagerErrorCode,
} from "../HttpNodeManagerError";

import { HttpNodeManager } from "../HttpNodeManager";
import { chainRpcConfig } from "../../../../config";

export class CometHttpManager extends HttpNodeManager {
	public static readonly MIN_NODE_COUNT: number = chainRpcConfig.http.cometBftHttp.minNodes;
	public static readonly MAX_NODE_COUNT: number = chainRpcConfig.http.cometBftHttp.maxNodes;

	protected constructor() {
		super();
	}

	// Override
	public static init(): void {
		if (this._instance) {
			throw new Error("Concrete instance of CometHttpManager(HttpNodeManager) is already initialized");
		}

		this._instance = new CometHttpManager();
	}

	// Override
	// TODO: Check to see whether the node is responsive before adding
	public registerNode(url: string): void {
		if (this.registeredNodeCount >= CometHttpManager.MAX_NODE_COUNT) {
			throw new HttpNodeManagerError(
				HttpNodeManagerErrorCode.ERR_MAX_NODES_REACHED,
			);
		}

		if (!url) {
			throw new HttpNodeManagerError(
				HttpNodeManagerErrorCode.ERR_INVALID_URL,
			);
		}

		if (this.isRegistered(url)) {
			throw new HttpNodeManagerError(
				HttpNodeManagerErrorCode.ERR_ALREADY_REGISTERED,
			);
		}

		this._urls.add(url);
	}

	// Override
	public removeNode(url: string): void {
		if (this.registeredNodeCount <= CometHttpManager.MIN_NODE_COUNT) {
			throw new HttpNodeManagerError(
				HttpNodeManagerErrorCode.ERR_MIN_NODES_REACHED,
			);
		}

		this._urls.delete(url);
	}
}
