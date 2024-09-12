import { Response } from "express";
import { BroadcastTxError, TimeoutError as TxTimeoutError } from "@cosmjs/stargate";
import { getErrorJSON } from "../helpers/error-message";

const badTxHttpCode = 400;
const upstreamTimeoutHttpCode = 504;

function handleBroadcastTxError(
	err: BroadcastTxError,
	res: Response,
): Response {

	const errorJSON: Record<string, any> = getErrorJSON(
		badTxHttpCode,
		"node failed to broadcast transaction",
		err.stack,
	);
	errorJSON["reason"] = err.message;
	errorJSON["log"] = err.log;
	errorJSON["codespace"] = err.codespace;

	return res.status(badTxHttpCode).json(errorJSON);
}

function handleTxTimeoutError(
	err: TxTimeoutError,
	res: Response,
): Response {

	const errorJSON: Record<string, any> = getErrorJSON(
		upstreamTimeoutHttpCode,
		"transaction timed out",
		err.stack,
	)
	errorJSON["reason"] = err.message;

	return res.status(upstreamTimeoutHttpCode).json(errorJSON);
}

export {
	handleBroadcastTxError,
	handleTxTimeoutError,
};
