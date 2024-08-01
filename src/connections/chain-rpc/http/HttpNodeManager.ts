import { Selector } from "../selector/Selector";

/**
 * Manage blockchain nodes
 */
export abstract class HttpNodeManager {
	protected static _instance: HttpNodeManager; // Singleton instance

	protected _urls: Set<string>;
	protected _selector: Selector;

	/**
	 * Private constructor to ensure singleton instance
	 */
	protected constructor(selector: Selector) {
		this._urls = new Set<string>();
		this._selector = selector;
	}

	public static get instance(): HttpNodeManager {
		if (!this._instance) {
			throw new Error("HttpNodeManager's concrete instance is not initialized");
		}

		return this._instance;
	}

	public static init(selector: Selector): void { }

	public get selectorClass(): string {
		return this._selector.constructor.name;
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