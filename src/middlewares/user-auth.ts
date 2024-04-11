import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import { errorHandler } from "./errors/error-handler";
import { decodeAndVerifyToken } from "../helpers/jwt-helper";
import { prisma } from "../database/prisma";
import createError from "http-errors";
import config from "../config";

export async function requireAccessToken(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const token = req.cookies.accessToken;

		if (!token) {
			throw createError(400, "Missing access token");
		}

		const decoded = decodeAndVerifyToken(token, config.auth.accessToken.secret);
		if (decoded instanceof Error) {
			throw createError(400, "Unauthorized access token");
		}
		
		// if (!(prisma.base_account.findFirst({
		// 	where: {
		// 		OR: [
		// 			{ email: decoded.email },
		// 			{ username: decoded.username }
		// 		]
		// 	}
		// }))) {
		// 	throw createError(401, "Unknown identity");
		// }

		// Attach the token's email and username to request body so the subsequent handlers don't have to query for them again
		req.body.injectedEmail = decoded.email;
		req.body.injectedUsername = decoded.username;
		next();

	} catch (err) {
		errorHandler(err, req, res, next);
	}
};

export async function requireRefreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const token = req.cookies.refreshToken;

		if (!token) {
			throw createError(400, "Missing refresh token");
		}

		const decoded = decodeAndVerifyToken(token, config.auth.refreshToken.secret);
		if (decoded instanceof Error) {
			throw createError(400, "Unauthorized refresh token");
		}

		req.body.injectedEmail = decoded.email;
		req.body.injectedUsername = decoded.username;
		next();
	} catch (err) {
		errorHandler(err, req, res, next);
	}
}