import WebSocket from "ws";
import { webSocketConfig } from "../../config";
import {
	WebSocketClientManagerError,
	WebSocketClientManagerErrorCode
} from "./WebSocketClientManagerError";

/**
 * WebSocketClientManager class.
 * 
 * Manages a pool of WebSocket clients, providing methods to initialize, retrieve, and close clients.
 */
export class WebSocketClientManager {
	/**
	 * Minimum client count.
	 * 
	 * The minimum number of clients that can be connected at any given time.
	 */
	public static readonly MIN_CLIENT_COUNT: number = webSocketConfig.client.minClientCount;

	/**
	 * Maximum client count.
	 * 
	 * The maximum number of clients that can be connected at any given time.
	 */
	public static readonly MAX_CLIENT_COUNT: number = webSocketConfig.client.maxClientCount;

	/**
	 * Map of client IDs to WebSocket clients.
	 * 
	 * A private map that stores WebSocket clients by their IDs.
	 */
	protected _idToClient: Map<number, WebSocket>;

	/**
	 * Singleton instance.
	 * 
	 * The singleton instance of the WebSocketClientManager.
	 */
	private static _instance: WebSocketClientManager;

	/**
	 * Private constructor to prevent direct instantiation.
	 * 
	 * Initializes the WebSocketClientManager instance.
	 */
	private constructor() {
		this._idToClient = new Map<number, WebSocket>();
	}

	/**
	 * Gets the singleton instance of the WebSocketClientManager.
	 * 
	 * Returns the singleton instance of the WebSocketClientManager.
	 * 
	 * @returns The singleton instance of the WebSocketClientManager.
	 */
	public static get instance(): WebSocketClientManager {
		if (!WebSocketClientManager._instance) {
			WebSocketClientManager._instance = new WebSocketClientManager();
		}

		return WebSocketClientManager._instance;
	}

	/**
	 * Gets a WebSocket client by ID.
	 * 
	 * Retrieves a WebSocket client by its ID.
	 * 
	 * @param id Client ID.
	 * @returns The WebSocket client associated with the given ID, or undefined if not found.
	 * 
	 * @example
	 * const clientManager = WebSocketClientManager.instance;
	 * const client = clientManager.getClient(1);
	 * if (client) {
	 *   console.log(`Client with ID 1 is connected`);
	 * } else {
	 *   console.log(`Client with ID 1 not found`);
	 * }
	 */
	public getClient(id: number): WebSocket | undefined {
		return this._idToClient.get(id);
	}

	/**
	 * Gets the current client count.
	 * 
	 * Returns the current number of connected clients.
	 * 
	 * @returns The current client count.
	 * 
	 * @example
	 * const clientManager = WebSocketClientManager.instance;
	 * console.log(`Current client count: ${clientManager.clientCount}`);
	 */
	public get clientCount(): number {
		return this._idToClient.size;
	}

	/**
	 * Initializes a new WebSocket client.
	 * 
	 * Creates a new WebSocket client and assigns it a unique ID.
	 * 
	 * @param url URL for the WebSocket connection.
	 * @returns An object containing the new WebSocket client and its ID.
	 * @throws `Error` if fails to create a WebSocket client, or if the maximum client count is reached.
	 * 
	 * @example
	 * const clientManager = WebSocketClientManager.instance;
	 * const { client, id } = clientManager.initClient('ws://example.com/ws');
	 * console.log(`New client with ID ${id} connected to ${client.url}`);
	 */
	public initClient(url: string): { client: WebSocket, id: number } {
		if (this.clientCount >= webSocketConfig.client.maxClientCount) {
			throw new WebSocketClientManagerError(
				WebSocketClientManagerErrorCode.ERR_MAX_CLIENTS_REACHED
			);
		}

		if (!url) {
			throw new WebSocketClientManagerError(
				WebSocketClientManagerErrorCode.ERR_INVALID_URL
			);
		}

		const client: WebSocket = new WebSocket(url);

		let id: number = this.clientCount + 1;
		while (this.getClient(id) != null) { // Acceptable runtime for small client counts.
			id++;
		}
		this.setClient(id, client);

		return { id: id, client: client }
	}

	/**
	 * Closes a WebSocket client by ID.
	 * 
	 * Closes a WebSocket client and removes it from the client map.
	 * 
	 * @param id Client ID.
	 * @throws `Error` if the client is not found, or if the minimum client count is reached.
	 * 
	 * @example
	 * const clientManager = WebSocketClientManager.instance;
	 * clientManager.closeClient(1);
	 * console.log(`Client with ID 1 disconnected`);
	 */
	public closeClient(id: number): void {
		if (this.clientCount <= WebSocketClientManager.MIN_CLIENT_COUNT) {
			throw new WebSocketClientManagerError(
				WebSocketClientManagerErrorCode.ERR_MIN_CLIENTS_REACHED
			);
		}

		if (!id) {
			throw new WebSocketClientManagerError(
				WebSocketClientManagerErrorCode.ERR_INVALID_ID
			);
		}

		const client: WebSocket = this.getClient(id);
		if (!client) {
			throw new WebSocketClientManagerError(
				WebSocketClientManagerErrorCode.ERR_CLIENT_NOT_FOUND
			);
		}

		client.removeAllListeners();
		client.close();
		this._idToClient.delete(id);
	}

	/**
	 * Sets a WebSocket client by ID.
	 * 
	 * Sets a WebSocket client by its ID in the internal map.
	 * 
	 * @param id Client ID.
	 * @param client WebSocket client.
	 * @protected
	 */
	protected setClient(id: number, client: WebSocket): void {
		this._idToClient.set(id, client);
	}
}