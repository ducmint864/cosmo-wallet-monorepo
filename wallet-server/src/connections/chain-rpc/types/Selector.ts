import { WebSocket } from "ws";

// Node selector
export interface Selector {
	selectRest(urls: string[]): Promise<string>;
	selectCometHttp(urls: string[]): Promise<string>;
	selectCometWs(clients: WebSocket[]): Promise<WebSocket>;
};