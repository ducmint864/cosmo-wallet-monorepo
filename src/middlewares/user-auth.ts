import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import { errorHandler } from "./errors/error-handler";
import { decodeAndVerifyToken, isTokenBlackListed } from "../helpers/jwt-helper";
import { BaseAccountJwtPayload } from "../helpers/types/BaseAccountJwtPayload";
import createError from "http-errors";
import config from "../config";

export async function requireAccessToken(req: Request, res: Response, next: NextFunction): Promise<void> {
	const accessToken: string = req.cookies.accessToken;
	const secret: string = config.auth.accessToken.secret;

	try {
		_preCheckAndThrow(accessToken);

		const decoded = <BaseAccountJwtPayload>decodeAndVerifyToken(accessToken, secret);
		if (!decoded) {
			throw createError(403, "Unauthorized access token");
		}

		req.body.decodedAccessTokenPayload = decoded;
		next();
	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

export async function requireRefreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
	const refreshToken: string = req.cookies.refreshToken;
	const secret: string = config.auth.refreshToken.secret;

	try {
		_preCheckAndThrow(refreshToken);

		const decoded = <BaseAccountJwtPayload>decodeAndVerifyToken(refreshToken, secret);
		if (!decoded) {
			throw createError(403, "Unauthorized refresh token");
		}

		// Inject the decoded payload of the token into the request body so the subsequent handlers don't have to query for it
		req.body.decodedRefreshTokenPayload = decoded;
		next();
	} catch (err) {
		errorHandler(err, req, res, next);
	}

}

async function _preCheckAndThrow(token: string): Promise<void> {
	if (!token) {
		throw createError(400, "Missing refresh token");
	}

	if (await isTokenBlackListed(token)) {
		throw createError(403, "Token is black-listed");
	}
}