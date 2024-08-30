import { Request, Response, NextFunction } from "express";
import { getErrorJSON } from "../helpers/error-message";
import { HttpError } from "http-errors";

// Handles http errors which were intentionally crafted and thrown by controllers
function handleHttpError(err: HttpError, res: Response, next: NextFunction): Response {
	// temporary
	return res.status(500).json(getErrorJSON(
		err.statusCode || 500,
		err.message || "Internal server error",
		err.stack,
	));
}

export {
	handleHttpError,
}