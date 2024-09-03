import { Request, Response, NextFunction } from "express";
import { errorHandler } from "../../errors/middlewares/error-handler";
import { UserAccountJwtPayload } from "../../types/UserAccountJwtPayload";
import { DeliverTxResponse, SigningStargateClient, GasPrice, StargateClient, assertIsDeliverTxSuccess } from "@cosmjs/stargate";
import { OfflineDirectSigner } from "@cosmjs/proto-signing";
import { getCometHttpNodeMan, prisma, redisClient } from "../../connections";
import { RedisClientType } from "redis";
import { decrypt, getEncryptionKey, getSigner } from "../../general/helpers/crypto-helper";
import { getStringsFromRequestBody, getObjectFromRequestBody } from "../../general/helpers/request-parser";
import { Coin } from "thasa-wallet-interface";
import { pushTxToStream } from "../helpers/tx-stream";
import { tx_status_enum } from "@prisma/client";
import { SaveTxPayload, createSaveTxPayload } from "../types/SaveTxPayload";
import createHttpError from "http-errors";

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

		const cometHttpNodeMan = await getCometHttpNodeMan();
		const cometHttpUrl: string = await cometHttpNodeMan.getNode();
		const stargateClient: SigningStargateClient = await SigningStargateClient.connectWithSigner(
			cometHttpUrl,
			signer,
			{ gasPrice: GasPrice.fromString("0.001stake") }
		);
		const txResponse: DeliverTxResponse = await stargateClient.sendTokens(fromAddress, toAddress, [coinToSend], "auto"); // Improve later, make more robust, handle more cases about gas-fee console.log("Tx response: " + tx); res.status(200).json(tx);
		assertIsDeliverTxSuccess(txResponse);
		// if (txResponse.code !== 0) {

		// }

		// console.log("DeliverTxResponse:\n", txResponse)
		// Logging
		// const obj = Object.entries(txResponse).map(([key, value]) => {
		// 	return [
		// 		key,
		// 		typeof value === "bigint" ? value?.toString() : value
		// 	];
		// });
		// writeFile("./DeliverTxResponse.json", JSON.stringify(obj, null, 2), undefined, () => ("DeliverTxResponse written to disk"));

		const txStatus: tx_status_enum = txResponse.code === 0
			? tx_status_enum.succeed
			: tx_status_enum.failed;

		const payload: SaveTxPayload = createSaveTxPayload(
			txResponse,
			txStatus,
			fromAddress,
			toAddress,
			userAccountId,
		);

		// push tx to stream so a consumer thread can read it and save to db
		await pushTxToStream(
			redisClient as RedisClientType,
			payload,
		)

		switch (txStatus) {
			case tx_status_enum.succeed:
				res.status(200).json({ message: "Transaction execution successful" });
				break;
			case tx_status_enum.failed:
				res.status(400).json({ message: "Transaction execution failed" });
				break;
		}
	} catch (err) {
		// if an error was thrown, it is likely to be type BroadcastTxError or TimeoutError (these types can be found in @cosmos/stargate package)
		// - in case error is BroadcastTxError, the node did not broacast tx, mostly because of CheckTx failures at such node
		// - in case error is TimeoutError, tx took too long without being included in any block
		// - otherwise, it is an unknown error and we handle it gracefully
		errorHandler(err, req, res, next);
	}
}

export { sendCoin };