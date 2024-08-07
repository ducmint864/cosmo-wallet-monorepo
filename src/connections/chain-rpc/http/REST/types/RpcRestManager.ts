import { HttpNodeManager } from "../../types/HttpNodeManager";
import { 
	HttpNodeManagerError,
	HttpNodeManagerErrorCode
} from "../../types/HttpNodeManagerError";
import { chainRpcConfig } from "../../../../../config";
import { Selector } from "../../../types/Selector";

export class RestRpcManager extends HttpNodeManager {
	public static readonly MIN_NODE_COUNT: number = chainRpcConfig.http.rpcRest.minNodes;
	public static readonly MAX_NODE_COUNT: number = chainRpcConfig.http.rpcRest.maxNodes;

	protected constructor(selector: Selector) {
		super(selector);
	}

	public static override init(selector: Selector): void {
		if (RestRpcManager._instance) {
			throw new Error("Concrete instance of RpcRestManager(HttpNodeManager) is already initialized");
		}

		this._instance = new RestRpcManager(selector);
	}

	// Override
	// TODO: check if the node is responsive before adding
	public override registerNode(url: string): void {
		if (this.registeredNodeCount >= RestRpcManager.MAX_NODE_COUNT) {
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
	public override removeNode(url: string): void {
		if (this.registeredNodeCount <= RestRpcManager.MIN_NODE_COUNT) {
			throw new HttpNodeManagerError(
				HttpNodeManagerErrorCode.ERR_MIN_NODES_REACHED,
			);
		}

		this._urls.delete(url);
	}

	// Override
	public override async getNode(): Promise<string> {
		const url: string = await this._selector.selectRest(
			this.registeredNodes
		);

		return url;
	}
}
