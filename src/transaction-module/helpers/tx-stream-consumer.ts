import { RedisClientType } from "redis";
import { getTxTimestamp } from "./tx-status";
import { PrismaClient } from "@prisma/client";
import { StargateClient } from '@cosmjs/stargate';
import { saveTxToDb } from './save-tx';
import { DeliverTxResponse } from '@cosmjs/stargate';
import { codecConfig, txConfig } from '../../config';
import { makeRequestWithTimeout } from './request';
import { SaveTxPayload } from '../types/SaveTxPayload';
import { decompressAndUnmarshal } from '../../general/helpers/compress';
import { getCometHttpNodeMan, prisma, redisClient } from "../../connections";
import { isMainThread, parentPort, workerData } from "worker_threads";
import { deepStrictEqual as assertDeepStrictEqual } from 'assert';

/**
 * 
 * 
 * Read transactions from the transaction stream stored in Redis,
 * processing each transaction by retrieving its timestamp, 
 * saving it to the database, and handling any errors that may occur during this process.
 * 
 * @param redisClient The Redis client used to read from the transaction stream.
 * @param prismaClient The Prisma client used to interact with the database.
 * @param stargateClient The Stargate client used to retrieve transaction timestamps.
 */
async function consumeTxStream(
	redisClient: RedisClientType,
	prismaClient: PrismaClient,
	stargateClient: StargateClient,
): Promise<void> {
	console.log("LOG:CONSUMING TX STREAM....")
	let isPerformingSaveOperation: boolean = false;

	const redisStreamKey: string = txConfig.txStream.redisKey;
	const txStreamName = txConfig.txStream.name;
	// lastReadId = 0 means reading from the beginning of stream
	let lastReadId: string = "0";
	const txCountPerRead: number = txConfig.txStream.txCountPerRead;

	while (true) {
		let streamList = await redisClient.XREAD(
			{
				key: redisStreamKey,
				id: lastReadId,
			},
			{
				BLOCK: 0, // BLOCK = 0 means wait indefinitely until there are new message (thread-blocking)
				COUNT: txCountPerRead, // COUNT: how many messages to retrieve from the stream at once 
			}
		);

		if (!streamList) {
			continue;
		}

		streamList = streamList.filter((stream) => stream.name === txStreamName);
		const txStream = streamList[0];
		if (!txStream) {
			// do sth
			continue;
		}

		let messageIdList: string[] = []; // list of message Ids in the tx stream
		let compressedPayloadList: Buffer[] = [];
		for (const messageWrapper of txStream.messages) {
			const compressedPayloadStr: string = messageWrapper.message["data"];
			const messageId: string = messageWrapper.id;
			console.log("COMPRESSED PAYLOAD STRING RETRIEVED FROM REDIS:\n", compressedPayloadStr);
			compressedPayloadList.push(Buffer.from(compressedPayloadStr, codecConfig.stringReprFormat));
			messageIdList.push(messageId);
		}
		assertDeepStrictEqual(compressedPayloadList.length, messageIdList.length);

		isPerformingSaveOperation = true;
		const compressedPayloadCount: number = compressedPayloadList.length;
		// Nextup: implement batch processing - resource requesting
		for (let index = 0; index < compressedPayloadCount; index++) {
			const compressedPayload: Buffer = compressedPayloadList[index];
			const payload = decompressAndUnmarshal<SaveTxPayload>(compressedPayload);

			// debug log
			console.log(`decompressed transaction:\n${payload}`)

			const txBlockHeight: number = payload.txResponse.height;
			if (!txBlockHeight) {
				// do sth
				console.error("LOG:tx payload have not block height");
				break;
			}

			const txHash: string = payload.txResponse.transactionHash;
			if (!txHash) {
				// do sth
				console.error("LOG:tx payload have no timestamp");
				break;
			}

			try {
				const requestTimeoutMilisecs: number = txConfig.requests.timeoutMilisecs;

				// get tx timestamp (throw error if exceed timeout/operation fail)
				const timestamp: string = await makeRequestWithTimeout(
					requestTimeoutMilisecs,
					getTxTimestamp,
					// args. of getTxTimestamp
					stargateClient,
					payload.txResponse.height
				);

				// save tx record to db (throw error and rollback if db transaction timed out or operation failed)
				await saveTxToDb(
					prismaClient,
					payload.txResponse as DeliverTxResponse,
					payload.txStatus,
					timestamp,
					payload.fromAddress,
					payload.toAddress,
					payload.userAccountId,
					txConfig.db.timeoutMilisecs,
				);

				// update lastReadId, remove read tx from stream
				lastReadId = messageIdList[index];
				await redisClient.XDEL(redisStreamKey, lastReadId);
			} catch (error) {
				// debug log
				// console.error(`Error saving tx: ${payload.txResponse.transactionHash}`, error);
				console.error("LOG: request timed out, error:\n", error)
				// push tx to stream again
				// await pushTxToStream(redisClient as RedisClientType, payload);
			} finally {
			}
		};
		isPerformingSaveOperation = false;
	}
}

function setupEventListeners(): void {
	parentPort.postMessage("LOG: WORKER THREAD IS RUNNING")
	// handle messages from parent thread (i.e. producer/main thread)
	parentPort.on("message", (message) => {
		if (message === "stop") {
			process.exit(0);
		}
	});
	console.log("LOG:SETUP CONSUMER EVENT LISTENER DONE");
}

// consumer thread will run this function, then this function calls consumeTxStream()
async function executeConsumer(): Promise<void> {
	console.log("LOG: EXECUTING CONSUMER THREAD");
	setupEventListeners();

	const cometHttpNodeMan = await getCometHttpNodeMan();
	const cometHttpUrl: string = await cometHttpNodeMan.getNode();
	const stargateClient: StargateClient = await StargateClient.connect(cometHttpUrl);

	await consumeTxStream(
		redisClient as RedisClientType,
		prisma,
		stargateClient,
	);
}

// execute if current thread is a worker thread
if (!isMainThread) {
	const threadNameKey: string = txConfig.txStream.consumerThread.nameKey;
	const threadNameValue: string = txConfig.txStream.consumerThread.nameValue;

	console.log("LOG:I AM NOT MAIN THREAD");
	if (workerData[threadNameKey] !== threadNameValue) {
		process.exit(0);
	}

	// do sth with thread id (not needed now)
	const threadIdKey: string = txConfig.txStream.consumerThread.idKey;

	executeConsumer();
}