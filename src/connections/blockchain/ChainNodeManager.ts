import { chainNodeConfig } from "../../config";
import {
	ChainNodeManagerError,
	ChainNodeManagerErrorCode
} from "./ChainNodeManagerError";

/**
 * Manage blockchain nodes
 */
export class ChainNodeManager {
	public static readonly MIN_NODE_COUNT: number = chainNodeConfig.minNodeCount;
	public static readonly MAX_NODE_COUNT: number = chainNodeConfig.maxNodeCount;

	private static _instance: ChainNodeManager; // Singleton instance

	protected _urls: Set<string>;

	private constructor() {
		this._urls = new Set<string>();
	}

	public static get instance(): ChainNodeManager {
		if (!this._instance) {
			this._instance = new ChainNodeManager();
		}

		return ChainNodeManager._instance;
	}

	public get registeredNodes(): string[] {
		return Array.from(this._urls.values());
	}

	public get registeredNodeCount(): number {
		return this._urls.size;
	}

	public isRegistered(url: string): boolean {
		return this._urls.has(url);
	}

	public registerNode(url: string): void {
		if (this.registeredNodeCount >= ChainNodeManager.MAX_NODE_COUNT) {
			throw new ChainNodeManagerError(
				ChainNodeManagerErrorCode.ERR_MAX_NODES_REACHED,
			);
		}

		if (!url) {
			throw new ChainNodeManagerError(
				ChainNodeManagerErrorCode.ERR_INVALID_URL,
			);
		}

		if (this.isRegistered(url)) {
			throw new ChainNodeManagerError(
				ChainNodeManagerErrorCode.ERR_ALREADY_REGISTERED,
			);
		}

		this._urls.add(url);
	}

	public removeNode(url: string): boolean {
		if (this.registeredNodeCount <= ChainNodeManager.MIN_NODE_COUNT) {
			throw new ChainNodeManagerError(
				ChainNodeManagerErrorCode.ERR_MIN_NODES_REACHED,
			);
		}

		return this._urls.delete(url);
	}
}