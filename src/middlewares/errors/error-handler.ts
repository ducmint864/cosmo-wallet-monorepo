import { Request, Response, NextFunction } from "express";
import { HttpError } from "http-errors";

export function errorHandler(err: HttpError, req: Request, res: Response, next: NextFunction) {
	if (res.headersSent) {
		return next(err);
	}

	// Handle internal server errors in detais
	if (err.message.includes("Unique constraint failed on the fields: (`email`)")) {
		return res.status(409).json({
			message: "Email has already been used",
			stack: err.stack
		})
	}

	if (err.message.includes("Unique constraint failed on the fields: (`username`)")) {
		return res.status(409).json({
			message: "Username has already been used",
			stack: err.stack
		})
	}

	return res.status(err.statusCode || 500).json({
		message: err.message,
		stack: err.stack,
	});
}
