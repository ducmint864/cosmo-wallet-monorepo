import { chainRpcConfig } from "../../../config";
import {
	HttpNodeManagerError,
	HttpNodeManagerErrorCode
} from "./HttpNodeManagerError";

/**
 * Manage blockchain nodes
 */
export abstract class HttpNodeManager {
	private static _instance: HttpNodeManager; // Singleton instance

	protected _urls: Set<string>;

	/**
	 * Private constructor to ensure singleton instance
	 */
	private constructor() {
		this._urls = new Set<string>();
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
	 * @throws {HttpNodeManagerError} If maximum number of nodes is reached
	 * @throws {HttpNodeManagerError} If URL is invalid
	 * @throws {HttpNodeManagerError} If node is already registered
	 *
	 * @example
	 * const manager = ChainNodeManager.instance;
	 * manager.registerNode("https://node3.com");
	 */
	public abstract registerNode(url: string): void;

	/**
	 * Remove a registered node
	 *
	 * @param {string} url Node URL to remove
	 * @returns {boolean} True if node was removed, false otherwise
	 *
	 * @throws {HttpNodeManagerError} If minimum number of nodes is reached
	 *
	 * @example
	 * const manager = ChainNodeManager.instance;
	 * manager.removeNode("https://node2.com");
	 */
	public abstract removeNode(url: string): void;
}