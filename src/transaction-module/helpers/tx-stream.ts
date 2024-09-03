import { RedisClientType } from "redis";
import { txConfig } from '../../config';
import { SaveTxPayload } from '../types/SaveTxPayload';
import { marshalAndCompress } from "../../general/helpers/compress";
import { codecConfig } from "../../config";

/**
 * Push tx to a stream to save to then save to db
 * @param redisClient 
 * @param txHash 
 */
async function pushTxToStream(redisClient: RedisClientType, payload: SaveTxPayload) {
	// compress payload for less cache memory usage
	const compressedPayloadStr: string = marshalAndCompress(payload)
		.toString(codecConfig.stringReprFormat);

	console.log("ORIGINAL COMPRESSED PAYLOAD STRING:\n", compressedPayloadStr);
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