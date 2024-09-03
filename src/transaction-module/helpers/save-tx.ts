import { PrismaClient } from "@prisma/client";
import { DeliverTxResponse } from "@cosmjs/stargate";
import { tx_status_enum } from "@prisma/client";
import { getFeesFromTxResponse } from "./tx-ressponse";
import { Coin } from "thasa-wallet-interface";
import createHttpError from "http-errors";

/**
 * Write transaction record to database with a timeout.
 * 
 * If timeout is exceeded, database will operation will rollback and the function throws and error
 * 
 * @param prismaClient 
 * @param cometWebSocketClient 
 * @param stargateClient 
 * @param txResponse 
 * @param fromAddress 
 * @param toAddress 
 * @param userAccountId 
 * @param prismaTimeoutMilisecs database transaction timeout (in miliseconds)
 * @throws error if insert fails
 */
async function saveTxToDb(
	prismaClient: PrismaClient,
	txResponse: DeliverTxResponse,
	txStatus: tx_status_enum,
	timestamp: string,
	fromAddress: string,
	toAddress: string,
	userAccountId: number,
	prismaTimeoutMilisecs: number,
): Promise<void> {
	// create a database transaction (this is not a blockchain transaction)
	await prismaClient.$transaction(
		async (prismaTx) => {
			// Wait for tx to finish (fail or succeed)
			console.log(`waiiting for events about transaction ${txResponse.transactionHash}...`);
			// txstatus = tx_status_enum.pending; // set default status
			// txStatus = await getTxStatus(txResponse.transactionHash, toAddress, stargateClient, cometWebSocketClient);

			//  Upsert (insert an anonymous wallet account if receiver is not stored in db, otherwise do nothin)
			try {
				await prismaClient.wallet_accounts.upsert({
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
					// fix
					timestamp: new Date(timestamp),
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
			timeout: prismaTimeoutMilisecs // if prisma db trans. exceeds this timeout, it will be rolled back
		}
	);
}

export {
	saveTxToDb,
}