import { WebSocketClientManager } from "./websocket/WebSocketClientManager";

// Singleton instance of WebSocketClientManager
const wsUrl = "ws://localhost:26657/websocket";
const webSocketClientManager = WebSocketClientManager.getInstance(wsUrl);

//

export {
	webSocketClientManager,
}