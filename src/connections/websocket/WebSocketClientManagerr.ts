import WebSocket from "ws"
import { webSocketConfig } from "../../config";

export class WebSocketClientManager {
	public static readonly MIN_CLIENT_COUNT: number = webSocketConfig.client.minClientCount;
	public static readonly MAX_CLIENT_COUNT: number = webSocketConfig.client.maxClientCount;

	protected _idToClient: Map<number, WebSocket>;
	protected _client: WebSocket
	protected _defaultUrl: string;

	// Singleton isntance
	private static _instance: WebSocketClientManager;	

	private constructor(defaultUrl?: string) {
		this._defaultUrl = defaultUrl ?? undefined;
	}

	public static getInstance(defaultUrl?: string): WebSocketClientManager {
		if (!WebSocketClientManager._instance) {
			WebSocketClientManager._instance = new WebSocketClientManager(defaultUrl);
		}

		return WebSocketClientManager._instance;
	}

	public get client(): WebSocket {
		return this._client;
	}

	public getClient(id: number): WebSocket {
		return this._idToClient.get(id);
	}


	public get clientCount(): number {
		return this._idToClient.size;
	}

	public initClient(url: string): { client: WebSocket, id: number } {
		if (this.clientCount >= webSocketConfig.client.maxClientCount) {
			throw new Error("Client count has reached limit!");
		}

		let client: WebSocket;
		if (!url) {
			if (!this.defaultUrl) {
				throw new Error("No url or default url provided");
			}

			client = new WebSocket(this.defaultUrl);
		} else {
			client = new WebSocket(url);
		}

		let id: number = this.clientCount + 1;
		while (this.getClient(id) != null) { // Acceptable runtime for small client counts.
			id++;
		}
		this.setClient(id, client);

		return { id: id, client: client}
	}

	public get defaultUrl(): string {
		return this._defaultUrl;
	}

	public closeClient(id: number): void {
		const client: WebSocket = this.getClient(id);
		client.close();
	}

	protected setClient(id: number, client: WebSocket): void {
		this._idToClient.set(id, client);
	}
}