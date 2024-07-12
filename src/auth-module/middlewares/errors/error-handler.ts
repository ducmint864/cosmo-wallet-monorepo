import { Request, Response, NextFunction } from "express";
import { HttpError } from "http-errors";

function getErrResponse(
	statusCode: number,
	errMsg: string,
	stackTrace: string | null | undefined
): object {
	return {
		status: statusCode,
		message: errMsg,
		stack: stackTrace || ""
	};
}

function errorHandler(err: HttpError, req: Request, res: Response, next: NextFunction) {
	if (res.headersSent) {
		return next(err);
	}

	// Handle internal server errors in detais
	if (err.message.includes("Unique constraint failed on the fields: (`email`)")) {
		return res.status(409)
		.json(getErrResponse(err.statusCode, "Email has been taken", err.stack));
	}

	if (err.message.includes("Unique constraint failed on the fields: (`username`)")) {
		return res.status(409)
		.json(getErrResponse(err.statusCode, "Username has been taken", err.stack));
	}

	return res.status(err.statusCode || 500)
	.json(getErrResponse(err.statusCode || 500, err.message, err.stack));
}

export { errorHandler };