import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import { errorHandler } from "./errors/error-handler";
import { decodeAndVerifyToken, isTokenBlackListed } from "../helpers/jwt-helper";
import createError from "http-errors";
import config from "../config";

export async function requireAccessToken(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const token = req.cookies.accessToken;

		if (!token) {
			throw createError(400, "Missing access token");
		}

		if (await isTokenBlackListed(token)) {
			throw createError(403, "Token is black-listed!");
		}

		const decoded = decodeAndVerifyToken(token, config.auth.accessToken.secret);
		if (!decoded) {
			throw createError(400, "Unauthorized access token");
		}
		
		// Attach the token's email and username to request body so the subsequent handlers don't have to query for them again
		req.body.injectedEmail = decoded.email;
		req.body.injectedUsername = decoded.username;
		next();

	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

export async function requireRefreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const token = req.cookies.refreshToken;

		if (!token) {
			throw createError(400, "Missing refresh token");
		}

		if (await isTokenBlackListed(token)) {
			throw createError(403, "Token is black-listed");
		}

		const decoded = decodeAndVerifyToken(token, config.auth.refreshToken.secret);
		if (!decoded) {
			throw createError(400, "Unauthorized refresh token");
		}

		req.body.injectedEmail = decoded.email;
		req.body.injectedUsername = decoded.username;
		next();
	} catch (err) {
		errorHandler(err, req, res, next);
	}
}