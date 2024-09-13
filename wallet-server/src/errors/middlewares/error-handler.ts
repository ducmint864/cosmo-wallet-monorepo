import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError } from "@prisma/client/runtime/library";
import { Request, Response, NextFunction } from "express";
import { HttpError } from "http-errors";
import { handlePrismaClientError } from "./prisma-error";
import { handleHttpError } from "./http-error";
import { BroadcastTxError, TimeoutError as TxTimeoutError } from "@cosmjs/stargate";
import { handleBroadcastTxError } from "./tx-error";
import { handleTxTimeoutError } from "./tx-error";

type SpecificHandler = (...args: any[]) => Response;

// map known types of error class to their specific handler func
const specificHandlerMapping: Record<string, SpecificHandler> = {
	[PrismaClientKnownRequestError.name]: handlePrismaClientError, // this is a func
	[PrismaClientUnknownRequestError.name]: handlePrismaClientError, // this is a func
	[BroadcastTxError.name]: handleBroadcastTxError,
	[TxTimeoutError.name]: handleTxTimeoutError,
};

function defaultSpecificHandler(err: Error, res: Response): Response {
	return handleHttpError(err as HttpError, res);
}

function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): Response | void {
	console.error("RAW ERROR: \n", err);
	if (res.headersSent) {
		return next(err);
	}

	const errClassName: string = err.constructor.name;
	const specificHandler = specificHandlerMapping[errClassName]

	if (specificHandler) {
		return specificHandler(err, res);
	}

	return defaultSpecificHandler(err, res)
}


export { errorHandler };