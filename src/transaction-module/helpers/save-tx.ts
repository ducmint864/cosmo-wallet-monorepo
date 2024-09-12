import { PrismaClient } from "@prisma/client";
import { DeliverTxResponse } from "@cosmjs/stargate";
import { tx_status_enum } from "@prisma/client";
import { getFeesFromTxResponse } from "./tx-response";
import { Coin } from "thasa-wallet-interface";
import createHttpError from "http-errors";
import { appLogger } from "../../logs";

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
			//  Upsert (insert an anonymous wallet account if receiver is not stored in db, otherwise do nothin)
			appLogger.trace("saveTxToDb: upserting wallet account into db...");
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
				appLogger.trace("saveTxToDb: upsert error!");
				throw createHttpError(500, "could not process receiver wallet account", upsertE);
			}
			

			appLogger.trace("saveTxToDb: inserting tx into db...");
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

			appLogger.trace("saveTxToDb: parsing fees from tx response...");
			const feeCoins: Coin[] = getFeesFromTxResponse(txResponse)
			const feeData = feeCoins.map((coin) => ({
				denom: coin.denom,
				amount: BigInt(coin.amount),
				tx_id: savedTx.tx_id
			}));

			appLogger.trace("saveTxToDb: inserting fees into db...");
			const batch = await prismaTx.transaction_fees.createMany({
				data: feeData
			})

			if (batch.count !== feeData.length) {
				appLogger.trace("saveTxToDb: quantity mismatch when inserting fees into db");
				throw createHttpError(500, "tx finished, unexpected error when saving tx fees");
			}
			appLogger.trace("insert finished");
		},
		{
			timeout: prismaTimeoutMilisecs // if prisma db trans. exceeds this timeout, it will be rolled back
		}
	);
}

export {
	saveTxToDb,
}