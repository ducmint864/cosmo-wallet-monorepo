import WebSocket from "ws";
import { webSocketConfig } from "../../config";

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
	 * Default WebSocket client.
	 */
	protected _client: WebSocket;

	/**
	 * Default URL for WebSocket connections.
	 */
	private _defaultUrl: string;

	/**
	 * Singleton instance.
	 */
	private static _instance: WebSocketClientManager;

	/**
	 * Private constructor to prevent direct instantiation.
	 * @param defaultUrl Default URL for WebSocket connections.
	 */
	private constructor(defaultUrl?: string) {
		this._idToClient = new Map<number, WebSocket>();
		this._defaultUrl = defaultUrl ?? undefined;
	}

	/**
	 * Gets the singleton instance of the WebSocketClientManager.
	 * @param defaultUrl Default URL for WebSocket connections.
	 * @returns The singleton instance of the WebSocketClientManager.
	 */
	public static getInstance(defaultUrl?: string): WebSocketClientManager {
		if (!WebSocketClientManager._instance) {
			WebSocketClientManager._instance = new WebSocketClientManager(defaultUrl);
		}

		return WebSocketClientManager._instance;
	}

	/**
	 * Gets the default WebSocket client.
	 * @returns The default WebSocket client.
	 */
	public get client(): WebSocket {
		return this._client;
	}

	/**
	 * Gets a WebSocket client by ID.
	 * @param id Client ID.
	 * @returns The WebSocket client associated with the given ID.
	 */
	public getClient(id: number): WebSocket {
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
	 * @param url URL for the WebSocket connection. Defaults to `defaultUrl` if `defaultUrl` was set during initialization of `WebSocketClientManager` instance
	 * @returns An object containing the new WebSocket client and its ID.
	 * @throws `Error` if fails to create a websocket client
	 */
	public initClient(url: string = this.defaultUrl): { client: WebSocket, id: number } {
		if (this.clientCount >= webSocketConfig.client.maxClientCount) {
			throw new Error("Client count has reached limit!");
		}

		let client: WebSocket;
		if (!url) {
			if (!this.defaultUrl) {
				throw new Error("No url or default url provided");
			}

			client = new WebSocket(this.defaultUrl, {});
		} else {
			client = new WebSocket(url);
		}

		let id: number = this.clientCount + 1;
		while (this.getClient(id) != null) { // Acceptable runtime for small client counts.
			id++;
		}
		this.setClient(id, client);

		return { id: id, client: client }
	}

	/**
	 * Gets the default URL for WebSocket connections.
	 * @returns The default URL for WebSocket connections.
	 */
	public get defaultUrl(): string {
		return this._defaultUrl;
	}

	/**
	 * Closes a WebSocket client by ID.
	 * @param id Client ID.
	 */
	public closeClient(id: number): void {
		const client: WebSocket = this.getClient(id);
		this._idToClient.delete(id);
		client.close();
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