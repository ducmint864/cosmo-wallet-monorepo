import { error } from "console";
import { Selector } from "./Selector";
import { WebSocket } from "ws";
import { CometWsManager } from "../comet-bft-websocket/CometWsManager";
import { CometWsUtil } from "../comet-bft-websocket/CometWsUtil";

export class RandomSelector implements Selector {
	protected getRandomElement<T>(array: Array<T>): T {
		const min = 0;
		const max = array.length - 1;
		const index = Math.floor(Math.random() * (max - min + 1)) + min;
		return array[index];
	}

	public async selectRest(urls: string[]): Promise<string> {
		return this.getRandomElement(urls);
	}

	public async selectCometHttp(urls: string[]): Promise<string> {
		return this.getRandomElement(urls);
	}

	public async selectCometWs(clients: WebSocket[]): Promise<WebSocket> {
		let client: WebSocket = this.getRandomElement(clients);

		if (client.readyState === WebSocket.CLOSED) {
			client = await CometWsUtil.reconnectClient(client);
		}

		return client;
	}
}

