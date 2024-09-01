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
import { txConfig } from "../../config";
import { pushTxToPendingQueue } from "../helpers/pending-queue";
import { tx_status_enum } from "@prisma/client";
import { saveTxToDb } from "../helpers/save-tx";
import { getLiveTxStatus } from "../helpers/tx-status";
import WebSocket from "ws";
import createHttpError from "http-errors";
import { PendingTxPayload } from "../types/PendingTxPayload";

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

		// waits til receiving websocket events about tx
		const cometWebSocketClient: WebSocket = await cometWsManager.getClient();
		const txStatus: tx_status_enum = await getLiveTxStatus(
			txResponse.transactionHash,
			toAddress,
			stargateClient,
			cometWebSocketClient,
		);


		const pendingTxPayload: PendingTxPayload = {
			fromAddress: fromAddress,
			toAddress: toAddress,
			txResponse: txResponse,
			userAccountId: userAccountId,
			txStatus: txStatus,
		};

		const serializablePayload: object = makeSerializable(pendingTxPayload);
		console.log("Size of pendingTxPayload object (uncompressed):", Buffer.byteLength(JSON.stringify(serializablePayload)));
		// console.log("Size of pendingTxPayload object (compressed):", Buffer.byteLength(JSON.stringify(pendingTxPayload)));


		// save transaction record to db
		await saveTxToDb(
			prisma,
			stargateClient,
			txResponse,
			txStatus,
			fromAddress,
			toAddress,
			userAccountId,
			txConfig.bank.db.saveTxDbTimeoutMilisecs,
		)

		switch (txStatus) {
			case tx_status_enum.succeed:
				res.status(200).json({ message: "Transaction completed successfully" });
				break;
			case tx_status_enum.failed:
				res.status(500).json({ message: "Transaction failed" });
				break;
			// default:
			// 	// If txStatus remains default enum, tx has most likely been timed out
			// 	res.status(500).json({ message: "tx took too long, please come back later" });
			// 	await pushTxToPendingQueue(redisClient as RedisClientType, txResponse.transactionHash); // Push to queue to process later	
			// 	break;
		}
	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

export { sendCoin };