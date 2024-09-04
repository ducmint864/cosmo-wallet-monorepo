import { Request, Response, NextFunction } from "express";
import { getErrorJSON } from "../helpers/error-message";
import { HttpError } from "http-errors";

// Handles http errors which were intentionally crafted and thrown by controllers
function handleHttpError(err: HttpError, res: Response, next: NextFunction): Response {
	// temporary
	const httpStatusCode = err.statusCode || 500;
	return res.status(httpStatusCode).json(getErrorJSON(
		httpStatusCode,
		err.message || "Internal server error",
		err.stack,
	));
}

export {
	handleHttpError,
}