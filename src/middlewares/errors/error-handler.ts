import { Request, Response, NextFunction } from "express";
import { HttpError } from "http-errors";

export function errorHandler(err: HttpError, req: Request, res: Response, next: NextFunction) {
	if (res.headersSent) {
		return next(err);
	}

	res.status(err.statusCode || 500).json({
		message: err.message,
		status: err.status,
		stack: err.stack,
	});
}
