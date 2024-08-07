import {
	HttpNodeManagerError,
	HttpNodeManagerErrorCode,
} from "../../types/HttpNodeManagerError";

import { HttpNodeManager } from "../../types/HttpNodeManager";
import { chainRpcConfig } from "../../../../../config";
import { Selector } from "../../../types/Selector";

export class CometHttpNodeManager extends HttpNodeManager {
	public static readonly MIN_NODE_COUNT: number = chainRpcConfig.http.cometBftHttp.minNodes;
	public static readonly MAX_NODE_COUNT: number = chainRpcConfig.http.cometBftHttp.maxNodes;

	protected constructor(selector: Selector) {
		super(selector);
	}

	// Must override (abstract method)
	public override get classRedisKey(): string {
		return CometHttpNodeManager.name;
	}

	// Override
	public static override init(selector: Selector): void {
		if (this._instance) {
			throw new Error("Concrete instance of CometHttpManager(HttpNodeManager) is already initialized");
		}

		this._instance = new CometHttpNodeManager(selector);
	}

	// Override
	// TODO: Check to see whether the node is responsive before adding
	public override async registerNode(url: string): Promise<void> {
		const nodeCount: number = await this.getRegisteredNodeCount();
		if (nodeCount >= CometHttpNodeManager.MAX_NODE_COUNT) {
			throw new HttpNodeManagerError(
				HttpNodeManagerErrorCode.ERR_MAX_NODES_REACHED,
			);
		}
		await super.registerNode(url);
	}

	// Override
	public override async removeNode(url: string): Promise<void> {
		const nodeCount: number = await this.getRegisteredNodeCount();
		if (nodeCount <= CometHttpNodeManager.MIN_NODE_COUNT) {
			throw new HttpNodeManagerError(
				HttpNodeManagerErrorCode.ERR_MIN_NODES_REACHED,
			);
		}
		await super.removeNode(url);
	}

	// Must override (abstract method)
	public override async getNode(): Promise<string> {
		const registeredNodes: string[] = await this.getRegisteredNodes();
		const url: string = await this._selector.selectCometHttp(registeredNodes);
		return url;
	}
}
