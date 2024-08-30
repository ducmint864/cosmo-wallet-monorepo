import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError } from "@prisma/client/runtime/library";
import { Request, Response, NextFunction } from "express";
import { HttpError } from "http-errors";
import { getErrorJSON } from "../helpers/error-message";
import { handlePrismaClientError } from "./prisma-error";
import { handleHttpError } from "./http-error";

type SpecificHandler = (...args: any[]) => Response;

// map known types of error class to their specific handler func
const specificHandlerMapping: Record<string, SpecificHandler> = {
	[PrismaClientKnownRequestError.name]: handlePrismaClientError, // this is a func
	[PrismaClientUnknownRequestError.name]: handlePrismaClientError, // this is a func
	[HttpError.name]: handleHttpError,
};

function defaultSpecificHandler(err: Error, res: Response): Response {
	return res.status(500).json(getErrorJSON(
		500,
		err.message || "Internal server error",
		err.stack,
	));
}

function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): Response | void {
	if (res.headersSent) {
		return next(err);
	}

	const errClassName: string = err.constructor.name;
	const specificHandler = specificHandlerMapping[errClassName]

	if (specificHandler) {
		return specificHandler(err, req, res);
	}

	return defaultSpecificHandler(err, res)
}


export { errorHandler };