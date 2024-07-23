import WebSocket from "ws";
import { webSocketConfig } from "../../config";
import {
	WebSocketClientManagerError,
	WebSocketClientManagerErrorCode
} from "./WebSocketClientManagerError";


/**
 * WebSocketClientManager class.
 */
export class WebSocketClientManager {
	/**
	 * Minimum client count.
	 */
	public static readonly MIN_CLIENT_COUNT: number = webSocketConfig.client.minClientCount;

	/**
	 * Maximum client count.
	 */
	public static readonly MAX_CLIENT_COUNT: number = webSocketConfig.client.maxClientCount;


	/**
	 * Map of client IDs to WebSocket clients.
	 */
	protected _idToClient: Map<number, WebSocket>;

	/**
	 * Singleton instance.
	 */
	private static _instance: WebSocketClientManager;

	/**
	 * Private constructor to prevent direct instantiation.
	 * @param defaultUrl Default URL for WebSocket connections.
	 */
	private constructor() {
		this._idToClient = new Map<number, WebSocket>();
	}

	/**
	 * Gets the singleton instance of the WebSocketClientManager.
	 * @param defaultUrl Default URL for WebSocket connections.
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
	 * @param id Client ID.
	 * @returns The WebSocket client associated with the given ID.
	 */
	public getClient(id: number): WebSocket | undefined {
		return this._idToClient.get(id);
	}

	/**
	 * Gets the current client count.
	 * @returns The current client count.
	 */
	public get clientCount(): number {
		return this._idToClient.size;
	}

	/**
	 * Initializes a new WebSocket client.
	 * @param url URL for the WebSocket connection. 
	 * @returns An object containing the new WebSocket client and its ID.
	 * @throws `Error` if fails to create a websocket client
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
	 * @param id Client ID.
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
	 * @param id Client ID.
	 * @param client WebSocket client.
	 */
	protected setClient(id: number, client: WebSocket): void {
		this._idToClient.set(id, client);
	}
}