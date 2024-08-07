import { HttpNodeManager } from "../../types/HttpNodeManager";
import { 
	HttpNodeManagerError,
	HttpNodeManagerErrorCode
} from "../../types/HttpNodeManagerError";
import { chainRpcConfig } from "../../../../../config";
import { Selector } from "../../../types/Selector";

export class BlockchainApiNodeManager extends HttpNodeManager {
	public static readonly MIN_NODE_COUNT: number = chainRpcConfig.http.rpcRest.minNodes;
	public static readonly MAX_NODE_COUNT: number = chainRpcConfig.http.rpcRest.maxNodes;

	protected constructor(selector: Selector) {
		super(selector);
	}

	// Must override (abstract method)
	protected override get classRedisKey(): string {
		return BlockchainApiNodeManager.name;
	}

	// Override
	public static override init(selector: Selector): void {
		if (BlockchainApiNodeManager._instance) {
			throw new Error("Concrete instance of RpcRestManager(HttpNodeManager) is already initialized");
		}

		this._instance = new BlockchainApiNodeManager(selector);
	}

	// Override
	// TODO: check if the node is responsive before adding
	public override async registerNode(url: string): Promise<void> {
		const nodeCount: number = await this.getRegisteredNodeCount();
		if (nodeCount >= BlockchainApiNodeManager.MAX_NODE_COUNT) {
			throw new HttpNodeManagerError(
				HttpNodeManagerErrorCode.ERR_MAX_NODES_REACHED,
			);
		}
		await super.registerNode(url);
	}

	// Override
	public override async removeNode(url: string): Promise<void> {
		const nodeCount: number = await this.getRegisteredNodeCount();
		if (nodeCount <= BlockchainApiNodeManager.MIN_NODE_COUNT) {
			throw new HttpNodeManagerError(
				HttpNodeManagerErrorCode.ERR_MIN_NODES_REACHED,
			);
		}
		await super.removeNode(url);
	}

	// Override
	public override async getNode(): Promise<string> {
		const registeredNodes: string[] = await this.getRegisteredNodes();
		const url: string = await this._selector.selectRest(registeredNodes);
		return url;
	}
}
