import { RedisClientType } from "redis";
import { txConfig } from '../../config';
import { SaveTxPayload } from '../types/SaveTxPayload';
import { marshalAndCompress } from "../../general/helpers/compress";
import { codecConfig } from "../../config";
import { appLogger } from "../../logs";

/**
 * Push tx to a stream to save to then save to db
 * @param redisClient 
 * @param txHash 
 */
async function pushTxToStream(redisClient: RedisClientType, payload: SaveTxPayload) {
	// compress payload for less cache memory usage
	const compressedPayloadStr: string = marshalAndCompress(payload)
		.toString(codecConfig.stringReprFormat);

	appLogger.debug(`original tx payload:\n${compressedPayloadStr}`);
	const streamRedisKey: string = txConfig.txStream.redisKey;
	await redisClient.XADD(
		streamRedisKey,
		"*",
		{ data: compressedPayloadStr, }
	);
}

export {
	pushTxToStream,
}