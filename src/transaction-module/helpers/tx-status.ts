import { StargateClient } from "@cosmjs/stargate";
import { tx_status_enum } from "@prisma/client";
import WebSocket from "ws";

// Get timestamp of transaction in RFC3339 format
async function getTxTimestamp(stargateClient: StargateClient, blockHeight: number): Promise<string> {
	const timestamp: string = (await stargateClient.getBlock(blockHeight)).header.time;
	return timestamp;
}

/**
 *	Get on-the-flight tx status based on events emitted by COSMOS chain's websocket
 * 
 *	Caution: use this function once for each transaction
 * @param txHash 
 * @param receiverAddress 
 * @param stargateClient 
 * @param cometWsClient 
 * @returns 
 */
async function getLiveTxStatus(
	txHash: string,
	receiverAddress: string,
	stargateClient: StargateClient,
	cometWsClient: WebSocket,
): Promise<tx_status_enum> {
	if (cometWsClient.readyState !== WebSocket.OPEN) {
		throw new Error("WebSocket connection is not open");
	}

	// Subscribe to websocket events
	cometWsClient.send(JSON.stringify({
		jsonrpc: "2.0",
		method: "subscribe",
		id: "1",
		params: {
			query: `tm.event='Tx' AND transfer.recipient='${receiverAddress}'`
		}
	}));

	// Listen for transaction status
	const transactionStatus = new Promise<tx_status_enum>((resolve, reject) => {
		const handleMessage = async (data: WebSocket.Data) => {
			try {
				const message = JSON.parse(data.toString());
				console.log("Websocket tx data: " + message);
				if (message.id === "1") {
					console.log("Received transaction notification!");

					const tx = await stargateClient.getTx(txHash);
					resolve(tx.code === 0 ? tx_status_enum.succeed : tx_status_enum.failed); // Transaction success if code is 0

					// Unsubscribe from events
					cometWsClient.send(JSON.stringify({
						jsonrpc: "2.0",
						method: "unsubscribe",
						id: "1",
						params: []
					}));

					cometWsClient.removeListener("message", handleMessage);
				}
			} catch (error) {
				reject(error);
			}
		};

		cometWsClient.on("message", handleMessage);
	});

	return await transactionStatus;
}

/**
 *	Get tx status in a static way
 * @param txHash 
 * @param stargateClient 
 * @returns 
 */
async function getTxStatus(
	txHash: string,
	stargateClient: StargateClient,
): Promise<tx_status_enum> {
	try {
		const tx = await stargateClient.getTx(txHash);
		return tx.code === 0 ? tx_status_enum.succeed : tx_status_enum.failed;
	} catch (error) {
		if (error instanceof Error && error.message.includes("not found")) {
			return tx_status_enum.pending;
		} else {
			throw error;
		}
	}
}

export {
	getTxTimestamp,
	getLiveTxStatus,
	getTxStatus,
}