import WebSocket from "ws";
import { webSocketConfig } from "../../../config";
import {
	CometWsManagerError,
	CometWsManagerErrorCode
} from "./CometWsManagerError";
import { Selector } from "../selector/Selector";

/**
 * WebSocketClientManager class.
 * 
 * Manages a pool of WebSocket clients, providing methods to initialize, retrieve, and close clients.
 */
export class CometWsManager {
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
	// protected _idToClient: Map<number, WebSocket>;
	protected _clients: WebSocket[];
	protected _selector: Selector;

	/**
	 * Singleton instance.
	 * 
	 * The singleton instance of the WebSocketClientManager.
	 */
	private static _instance: CometWsManager;

	/**
	 * Private constructor to prevent direct instantiation.
	 * 
	 * Initializes the WebSocketClientManager instance.
	 */
	private constructor(selector: Selector) {
		// this._idToClient = new Map<number, WebSocket>();
		this._clients = [];
		this._selector = selector;
	}

	public static init(selector: Selector): void {
		if (CometWsManager._instance) {
			throw new Error("WebSocketClientManager instance already initialized");
		}

		CometWsManager._instance = new CometWsManager(selector);
	}

	/**
	 * Gets the singleton instance of the WebSocketClientManager.
	 * 
	 * Returns the singleton instance of the WebSocketClientManager.
	 * 
	 * @returns The singleton instance of the WebSocketClientManager.
	 */
	public static get instance(): CometWsManager {
		if (!CometWsManager._instance) {
			throw new Error("WebSocketClientManager not initialized");
		}

		return CometWsManager._instance;
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
	public async getClient(): Promise<WebSocket> {
		if (this._clients.length === 0) {
			throw new CometWsManagerError(
				CometWsManagerErrorCode.ERR_CLIENT_NOT_FOUND
			);
		}

		const client: WebSocket = await this._selector.selectCometWs(
			this._clients
		);

		return client;
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
		return this._clients.length;
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
	public addClient(url: string): WebSocket {
		if (this.clientCount >= webSocketConfig.client.maxClientCount) {
			throw new CometWsManagerError(
				CometWsManagerErrorCode.ERR_MAX_CLIENTS_REACHED
			);
		}

		let client: WebSocket;
		try {
			client = new WebSocket(url);
		} catch (err) {
			throw new CometWsManagerError(
				CometWsManagerErrorCode.ERR_ADD_CLIENT_FAILED,
				err.message
			);
		}

		client.on("open", () => {
			console.log("WS client init successful");
		});

		client.on("close", () => {
			console.log("WS client closed")
		});

		client.on("error", (err) => {
			console.error("WS client error:", err);
		})

		this._clients.push(client);
		return client;
	}

	/**
	 * Closes a WebSocket client by ID.
	 * 
	 * Closes a WebSocket client and removes it from the client map.
	 * 
	 * @param index Client ID.
	 * @throws `Error` if the client is not found, or if the minimum client count is reached.
	 * 
	 * @example
	 * const clientManager = WebSocketClientManager.instance;
	 * clientManager.closeClient(1);
	 * console.log(`Client with ID 1 disconnected`);
	 */
	public removeClient(client: WebSocket): void {
		if (this.clientCount <= CometWsManager.MIN_CLIENT_COUNT) {
			throw new CometWsManagerError(
				CometWsManagerErrorCode.ERR_MIN_CLIENTS_REACHED
			);
		}

		const index: number = this._clients.indexOf(client);

		if (index < 0) {
			throw new CometWsManagerError(
				CometWsManagerErrorCode.ERR_CLIENT_NOT_FOUND
			);
		}

		client.removeAllListeners();
		client.close();
		this._clients.splice(index, 1);
	}

	public get selectorClass(): string {
		return this._selector.constructor.name;
	}

	public get urls(): string[] {
		return this._clients.map(client => client.url);
	}
}