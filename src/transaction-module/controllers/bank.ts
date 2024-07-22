import { Request, Response, NextFunction } from "express";
import { errorHandler } from "../../middlewares/errors/error-handler";
import { UserAccountJwtPayload } from "../../types/BaseAccountJwtPayload";
import { DeliverTxResponse, SigningStargateClient, GasPrice, StargateClient } from "@cosmjs/stargate";
import { OfflineDirectSigner } from "@cosmjs/proto-signing";
import { prisma } from "../../connections/database/prisma";
import { decrypt, getEncryptionKey, getSigner } from "../../helpers/crypto-helper";
import { getStringsFromRequestBody, getObjectFromRequestBody } from "../../helpers/request-parser";
import { Coin } from "thasa-wallet-interface";
import { writeFile } from "fs"
import WebSocket from "ws";
import createHttpError from "http-errors";

const nodeWsUrl = "ws://localhost:26657/websocket";
const wsClient = new WebSocket(nodeWsUrl);

wsClient.on("open", () => {
	console.log("Connected to node's websocket server");
});

wsClient.on("close", () => {
	console.log("Disconnecte from node's websocket server")
});

wsClient.on("error", (err) => {
	console.log("Webscoket client error:", err);
})

async function sendCoin(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	const {
		password,
		fromAddress,
		toAddress
	} = getStringsFromRequestBody(req, "password", "fromAddress", "toAddress");

	// Only support single-coin sending, for now
	const coinToSend = <Coin>getObjectFromRequestBody(req, "coin");
	console.log(coinToSend);

	try {
		// Runtime type-checking to see whether coinToSend obj is recognizable as instance of Coin interface
		if (
			!coinToSend.denom ||
			!coinToSend.amount ||
			typeof coinToSend.denom !== "string" ||
			typeof coinToSend.amount !== "string"
		) {
			throw createHttpError(400, "Invalid coin object");
		}

		const tokenPayload: UserAccountJwtPayload = req.body.decodedAccessTokenPayload;
		const userAccountId: number = tokenPayload.userAccountId;

		// Get mnemonic
		const userAccount = await prisma.user_accounts.findUnique({
			where: {
				user_account_id: userAccountId,
			},
			select: {
				crypto_mnemonic: true,
				crypto_iv: true,
				crypto_pbkdf2_salt: true,
				wallet_accounts: {
					where: {
						address: fromAddress,
					},
					select: {
						crypto_hd_path: true,
					}
				}
			}
		})

		if (!userAccount) {
			throw createHttpError(404, "User account not found/might have been deleted");
		}

		// Extract wallet account	
		const walletAccount = userAccount.wallet_accounts[0];
		if (!walletAccount) {
			throw createHttpError(404, "Wallet account not found / isn't owned by user / might have been deleted");
		}
		console.log(walletAccount);

		// Decrypt mnemonic
		const encryptionKey: Buffer = await getEncryptionKey(
			password,
			userAccount.crypto_pbkdf2_salt
		);
		const mnemonic: string = decrypt(
			userAccount.crypto_mnemonic,
			encryptionKey,
			userAccount.crypto_iv
		);

		console.log(mnemonic);

		// Sign and broadcast transaction 
		const signer: OfflineDirectSigner = await getSigner(
			mnemonic,
			undefined,
			walletAccount.crypto_hd_path,
		);
		const accounts = await signer.getAccounts();
		console.log(accounts);

		const url = "http://localhost:26657";
		const client: SigningStargateClient = await SigningStargateClient.connectWithSigner(
			url,
			signer,
			{ gasPrice: GasPrice.fromString("0.001stake") }
		);
		let txResponse: DeliverTxResponse = await client.sendTokens(fromAddress, toAddress, [coinToSend], "auto"); // Improve later, make more robust, handle more cases about gas-fee console.log("Tx response: " + tx); res.status(200).json(tx);
		const txHash = txResponse.transactionHash;

		// Logging
		const obj = Object.entries(txResponse).map(([key, value]) => {
			return [
				key,
				typeof value === "bigint" ? value?.toString() : value
			];
		});
		writeFile("./DeliverTxResponse.json", JSON.stringify(obj, null, 2), undefined, () => ("DeliverTxResponse written to disk"));

		console.log("Broadcasted tranaction, waiiting for it to finish...");
		const success: boolean = await isTxSuccessful(txHash, client, wsClient, toAddress);
		if (success) {
			res.status(200).json({
				message: "Transaction completed successfully",
				wallet: {}
			});
		} else {
			res.status(500).json({
				message: ("Transaction failed"),
			})
		}
		console.log("Transaction lifecycle finished!");
	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

async function isTxSuccessful(
	txHash: string,
	stargateClient: StargateClient,
	wsClient: WebSocket,
	receiverAddress: string,
): Promise<boolean> {
	if (wsClient.readyState !== WebSocket.OPEN) {
		throw new Error("WebSocket connection is not open");
	}

	// Subscribe to transaction events
	wsClient.send(JSON.stringify({
		jsonrpc: "2.0",
		method: "subscribe",
		id: "1",
		params: {
			query: `tm.event='Tx' AND transfer.recipient='${receiverAddress}'`
		}
	}));

	// Listen for transaction status
	const transactionStatus = new Promise<boolean>((resolve, reject) => {
		const handleMessage = async (data: WebSocket.Data) => {
			try {
				const message = JSON.parse(data.toString());
				if (message.id === "1") {
					console.log("Received transaction notification!");

					const tx = await stargateClient.getTx(txHash);
					resolve(tx.code === 0); // Transaction success if code is 0

					// Unsubscribe from events
					wsClient.send(JSON.stringify({
						jsonrpc: "2.0",
						method: "unsubscribe",
						id: "1",
						params: []
					}));

					wsClient.removeListener("message", handleMessage);
				}
			} catch (error) {
				reject(error);
			}
		};

		wsClient.on("message", handleMessage);
	});

	return await transactionStatus;
}

export { sendCoin }
