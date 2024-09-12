import { Selector } from "../../types/Selector";
import { redisClient } from "../../../redis/redis-client";
import { HttpNodeManagerError, HttpNodeManagerErrorCode } from "./HttpNodeManagerError";
import { getCspDirectivesInRedis, setCspDirectivesInRedis } from "../../../../security/middlewares/csp";

/**
 * Manage blockchain nodes
 */
export abstract class HttpNodeManager {
	protected static _instance: HttpNodeManager; // Singleton instance

	protected _selector: Selector;

	public abstract get classRedisKey(): string; // Retrieve class's persistent states from redis with this key

	protected get redisKeyCollection(): {
		registeredNodesKey: string
	} {
		const keys: any = {};
		keys["registeredNodesKey"] = this.classRedisKey.concat(".", "registeredNodes");

		return keys;
	}

	/**
	 * Private constructor to ensure singleton instance
	*/
	protected constructor(selector: Selector) {
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
	public async getRegisteredNodes(): Promise<string[]> {
		const stateKey: string = this.redisKeyCollection.registeredNodesKey;
		const urls: string[] = await redisClient.SMEMBERS(stateKey);
		return urls;
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
	public async getRegisteredNodeCount(): Promise<number> {
		const stateKey: string = this.redisKeyCollection.registeredNodesKey;
		const nodeCount: number = await redisClient.SCARD(stateKey);
		return nodeCount;
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
	public async isRegistered(url: string): Promise<boolean> {
		const stateKey: string = this.redisKeyCollection.registeredNodesKey;
		const isMember: boolean = await redisClient.SISMEMBER(stateKey, url);
		return isMember;
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
	public async registerNode(url: string): Promise<void> {
		if (!url) {
			throw new HttpNodeManagerError(
				HttpNodeManagerErrorCode.ERR_INVALID_URL,
			);
		}

		const stateKey: string = this.redisKeyCollection.registeredNodesKey;
		const addedCount: number = await redisClient.SADD(stateKey, url);
		if (addedCount < 1) {
			throw new HttpNodeManagerError(
				HttpNodeManagerErrorCode.ERR_ALREADY_REGISTERED
			);
		}

		// Update CSP to trust new nodes
		const cspDirectives: Record<string, string[]> = await getCspDirectivesInRedis()
		cspDirectives["connectSrc"].push(url);
		await setCspDirectivesInRedis(cspDirectives);
	}

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
	public async removeNode(url: string): Promise<void> {
		const stateKey: string = this.redisKeyCollection.registeredNodesKey;
		const removedCount: number = await redisClient.SREM(stateKey, url);
		if (removedCount < 1) {
			throw new HttpNodeManagerError(
				HttpNodeManagerErrorCode.ERR_NOT_REGISTERED
			);
		}
	}

	public abstract getNode(): Promise<string>;
}