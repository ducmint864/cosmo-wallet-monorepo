import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { RedisClientType } from "redis";
import { getRedisKey } from "../../general/helpers/redis-helper";
import { getTxStatus } from "./tx-status";
import { PrismaClient, tx_status_enum } from "@prisma/client";
import { redisClient } from "../../connections";
import { saveTxToDb } from './save-tx';
import { StargateClient } from '@cosmjs/stargate';
import { WebSocket } from 'ws';
import { DeliverTxResponse } from '@cosmjs/stargate';
import { txConfig } from '../../config';

/**
 * Push tx that were failed to be saved to db at first time to a pending queue and re-attempt doing so
 * @param redisClient 
 * @param txHash 
 */
async function pushTxToPendingQueue(redisClient: RedisClientType, txHash: string) {
	const redisQueueKey: string = getRedisKey("tx", tx_status_enum.pending);
	await redisClient.LPUSH(redisQueueKey, txHash);
}

async function handlePendingQueue(
	prismaClient: PrismaClient,
	stargateClient: StargateClient,
	txResponse: DeliverTxResponse,
	fromAddress: string,
	toAddress: string,
	userAccountId: number,
	prismaTimeoutMilisecs: number,
): Promise<void> {
	const queueName: string = tx_status_enum.pending.concat("tx");
	const redisKey: string = getRedisKey(queueName);

	while (true) {
		const txHash: string = await redisClient.RPOP(redisKey);
		if (!txHash) {
			// Queue is empty, wait for 1 second before checking again
			await new Promise(resolve => setTimeout(resolve, 1000));
			continue;
		}

		try {
			// attempt to fetch tx status with a timeout
			const txStatus: tx_status_enum = await Promise.race([
				getTxStatus(txHash, stargateClient),
				new Promise((_, reject) => {
					setTimeout(() => reject(
						new Error('fetch status timeout')), txConfig.bank.requests.timeoutMilisecs
					)
				}),
			]) as tx_status_enum;

			await saveTxToDb(
				prismaClient,
				stargateClient,
				txResponse,
				txStatus,
				fromAddress,
				toAddress,
				userAccountId,
				prismaTimeoutMilisecs,
			)
		} catch (error) {
			console.error(`Error processing pending tx: ${txHash}`, error);
		}
	}
}

// if (isMainThread) {
// 	// Create a new worker thread
// 	const worker = new Worker(__filename, {
// 		workerData: {},
// 	});
// } else {
// 	// Start handling the pending queue
// 	handlePendingQueue();
// }


export {
	pushTxToPendingQueue,
}