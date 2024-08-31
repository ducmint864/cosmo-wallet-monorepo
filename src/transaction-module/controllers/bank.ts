import { Request, Response, NextFunction } from "express";
import { errorHandler } from "../../errors/middlewares/error-handler";
import { UserAccountJwtPayload } from "../../types/UserAccountJwtPayload";
import { DeliverTxResponse, SigningStargateClient, GasPrice, StargateClient } from "@cosmjs/stargate";
import { OfflineDirectSigner } from "@cosmjs/proto-signing";
import { prisma } from "../../connections";
import { decrypt, getEncryptionKey, getSigner } from "../../general/helpers/crypto-helper";
import { getStringsFromRequestBody, getObjectFromRequestBody } from "../../general/helpers/request-parser";
import { Coin } from "thasa-wallet-interface";
import { writeFile } from "fs"
import { cometWsManager, cometHttpNodeMan } from "../../connections";
import { getFeesFromTxResponse } from "../helpers/tx-ressponse";
import { PrismaClient, tx_status_enum } from "@prisma/client";
import { txConfig } from "../../config";
import { redisClient } from "../../connections";
import { RedisClientType } from "redis";
import WebSocket from "ws";
import createHttpError from "http-errors";

const redisKeyPrefix: string = "bank"

function getRedisKey(...names: string[]): string {
	let redisKey: string = redisKeyPrefix;
	names.forEach((name) => redisKey += name);
	return redisKey;
}

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

	// Get user info via access token
	const accessTokenPayload: UserAccountJwtPayload = req.body["decodedAccessTokenPayload"]

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

		// Sign and broadcast transaction 
		const signer: OfflineDirectSigner = await getSigner(
			mnemonic,
			undefined,
			walletAccount.crypto_hd_path,
		);
		const accounts = await signer.getAccounts();
		console.log(accounts);

		const cometHttpUrl: string = await cometHttpNodeMan.getNode();
		const stargateClient: SigningStargateClient = await SigningStargateClient.connectWithSigner(
			cometHttpUrl,
			signer,
			{ gasPrice: GasPrice.fromString("0.001stake") }
		);
		let txResponse: DeliverTxResponse = await stargateClient.sendTokens(fromAddress, toAddress, [coinToSend], "auto"); // Improve later, make more robust, handle more cases about gas-fee console.log("Tx response: " + tx); res.status(200).json(tx);
		console.log("DeliverTxResponse:\n", txResponse)

		// Logging
		const obj = Object.entries(txResponse).map(([key, value]) => {
			return [
				key,
				typeof value === "bigint" ? value?.toString() : value
			];
		});
		writeFile("./DeliverTxResponse.json", JSON.stringify(obj, null, 2), undefined, () => ("DeliverTxResponse written to disk"));

		const cometWebSocketClient: WebSocket = await cometWsManager.getClient();
		const txStatus: tx_status_enum = await saveTxToDb(
			prisma,
			cometWebSocketClient,
			stargateClient,
			txResponse,
			fromAddress,
			toAddress,
			accessTokenPayload.userAccountId,
			txConfig.bank.db.saveTxDbTimeoutMilisecs
		);

		switch (txStatus) {
			case tx_status_enum.succeed:
				res.status(200).json({ message: "Transaction completed successfully" });
				break;
			case tx_status_enum.failed:
				res.status(500).json({ message: "Transaction failed" });
				break;
			default:
				// If txStatus remains default enum, tx has most likely been timed out
				res.status(500).json({ message: "tx took too long, please come back later" });
				await pushTxToPendingQ(redisClient as RedisClientType, txResponse.transactionHash); // Push to queue to process later	
				break;
		}
	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

// Get timestamp of transaction in RFC3339 format
async function getTxTimestamp(stargateClient: StargateClient, blockHeight: number): Promise<string> {
	const timestamp: string = (await stargateClient.getBlock(blockHeight)).header.time;
	return timestamp;
}

async function getTxStatus(
	txHash: string,
	stargateClient: StargateClient,
	cometWsClient: WebSocket,
	receiverAddress: string,
): Promise<tx_status_enum> {
	if (cometWsClient.readyState !== WebSocket.OPEN) {
		throw new Error("WebSocket connection is not open");
	}

	// Subscribe to transaction events
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
 * 
 * @param prisma 
 * @param cometWebSocketClient 
 * @param stargateClient 
 * @param txResponse 
 * @param fromAddress 
 * @param toAddress 
 * @param userAccountId 
 * @param timeoutMilisecs database transaction timeout (in miliseconds)
 * @returns 
 */
async function saveTxToDb(
	prisma: PrismaClient,
	cometWebSocketClient: WebSocket,
	stargateClient: StargateClient,
	txResponse: DeliverTxResponse,
	fromAddress: string,
	toAddress: string,
	userAccountId: number,
	timeoutMilisecs: number,
): Promise<tx_status_enum> {
	let txStatus: tx_status_enum; // default status
	await prisma.$transaction(
		async (prismaTx) => {
			// Wait for tx to finish (fail or succeed)
			console.log("Broadcasted tranaction, waiiting for it to finish...");
			txStatus = tx_status_enum.pending; // default type
			txStatus = await getTxStatus(txResponse.transactionHash, stargateClient, cometWebSocketClient, toAddress);

			//  Upsert (insert an anonymous wallet account if receiver is not stored in db, otherwise do nothin)
			try {
				await prisma.wallet_accounts.upsert({
					where: {
						address: toAddress
					},
					create: {
						address: toAddress
					},
					update: {
						// do nothin
					}
				})
			} catch (upsertE) {
				throw createHttpError(500, "cannot process receiver wallet account", upsertE);
			}

			const savedTx = await prismaTx.transactions.create({
				data: {
					tx_hash: txResponse.transactionHash,
					timestamp: new Date(await getTxTimestamp(stargateClient, txResponse.height)),
					sender_address: fromAddress, // FK in db (nullable)
					receiver_address: toAddress, // FK in db (nullable)
					gas_limit: txResponse.gasWanted,
					gas_used: txResponse.gasUsed,
					status: txStatus,
					sender_account_id: userAccountId, // FK in db (nullable)
				}
			});

			const feeCoins: Coin[] = getFeesFromTxResponse(txResponse)
			const feeData = feeCoins.map((coin) => ({
				denom: coin.denom,
				amount: BigInt(coin.amount),
				tx_id: savedTx.tx_id
			}));
			const batch = await prismaTx.transaction_fees.createMany({
				data: feeData
			})

			if (batch.count !== feeData.length) {
				throw createHttpError(500, "tx finished, unexpected tx fees");
			}
		},
		{
			timeout: timeoutMilisecs // waits for response from getTxTimestamp for these amt. of for milisecs
		}
	);

	return txStatus;
}

// Push tx to pending queue to later re-fetch and save to db
async function pushTxToPendingQ(redisClient: RedisClientType, txHash: string) {
	const queueName: string = tx_status_enum.pending.concat("tx");
	const redisKey: string = getRedisKey(queueName);
	await redisClient.LPUSH(redisKey, txHash);
}

export { sendCoin };