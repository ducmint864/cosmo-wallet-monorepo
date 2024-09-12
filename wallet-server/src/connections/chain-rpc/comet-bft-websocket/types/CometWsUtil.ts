import { WebSocket } from "ws";

export class CometWsUtil {
	public static async reconnectClient(client: WebSocket): Promise<WebSocket> {
		if (client.readyState !== client.CLOSED) {
			return client;
		}

		// Re-connect by assigning old client to a new client
		const newClientPromise = new Promise<WebSocket>((resolve, reject) => {
			const newClient = new WebSocket(client.url);
			newClient.once("open", () => {
				if (newClient.readyState === WebSocket.OPEN) {
					resolve(newClient)
				}
			});
			newClient.once("error", (err) => reject(err));
		});

		const newClient: WebSocket = await newClientPromise;

		// Copy listeners
		client.eventNames().forEach((eventName) => {
			const listeners = client.listeners(eventName)
			listeners.forEach((listener: any) => {
				newClient.on(eventName, listener);
			})
		})

		return newClient;
	}
}