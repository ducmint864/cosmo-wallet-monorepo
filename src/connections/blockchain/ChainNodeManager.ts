import { chainNodeConfig } from "../../config";
import {
	ChainNodeManagerError,
	ChainNodeManagerErrorCode
} from "./ChainNodeManagerError";

/**
 * Manage blockchain nodes
 */
export class ChainNodeManager {
	/**
	 * Minimum number of nodes required
	 */
	public static readonly MIN_NODE_COUNT: number = chainNodeConfig.minNodeCount;

	/**
	 * Maximum number of nodes allowed
	 */
	public static readonly MAX_NODE_COUNT: number = chainNodeConfig.maxNodeCount;

	private static _instance: ChainNodeManager; // Singleton instance

	protected _urls: Set<string>;

	/**
	 * Private constructor to ensure singleton instance
	 */
	private constructor() {
		this._urls = new Set<string>();
	}

	/**
	 * Get the singleton instance of ChainNodeManager
	 *
	 * @returns {ChainNodeManager} Singleton instance
	 */
	public static get instance(): ChainNodeManager {
		if (!this._instance) {
			this._instance = new ChainNodeManager();
		}

		return ChainNodeManager._instance;
	}

	/**
	 * Get an array of registered node URLs
	 *
	 * @returns {string[]} Array of registered node URLs
	 *
	 * @example
	 * const manager = ChainNodeManager.instance;
	 * const nodes = manager.registeredNodes; // ["https://node1.com", "https://node2.com"]
	 */
	public get registeredNodes(): string[] {
		return Array.from(this._urls.values());
	}

	/**
	 * Get the number of registered nodes
	 *
	 * @returns {number} Number of registered nodes
	 *
	 * @example
	 * const manager = ChainNodeManager.instance;
	 * const count = manager.registeredNodeCount; // 2
	 */
	public get registeredNodeCount(): number {
		return this._urls.size;
	}

	/**
	 * Check if a node is registered
	 *
	 * @param {string} url Node URL to check
	 * @returns {boolean} True if node is registered, false otherwise
	 *
	 * @example
	 * const manager = ChainNodeManager.instance;
	 * const isRegistered = manager.isRegistered("https://node1.com"); // true
	 */
	public isRegistered(url: string): boolean {
		return this._urls.has(url);
	}

	/**
	 * Register a new node
	 *
	 * @param {string} url Node URL to register
	 *
	 * @throws {ChainNodeManagerError} If maximum number of nodes is reached
	 * @throws {ChainNodeManagerError} If URL is invalid
	 * @throws {ChainNodeManagerError} If node is already registered
	 *
	 * @example
	 * const manager = ChainNodeManager.instance;
	 * manager.registerNode("https://node3.com");
	 */
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

	/**
	 * Remove a registered node
	 *
	 * @param {string} url Node URL to remove
	 * @returns {boolean} True if node was removed, false otherwise
	 *
	 * @throws {ChainNodeManagerError} If minimum number of nodes is reached
	 *
	 * @example
	 * const manager = ChainNodeManager.instance;
	 * manager.removeNode("https://node2.com");
	 */
	public removeNode(url: string): boolean {
		if (this.registeredNodeCount <= ChainNodeManager.MIN_NODE_COUNT) {
			throw new ChainNodeManagerError(
				ChainNodeManagerErrorCode.ERR_MIN_NODES_REACHED,
			);
		}

		return this._urls.delete(url);
	}
}