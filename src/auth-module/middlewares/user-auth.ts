import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import { errorHandler } from "../../errors/middlewares/error-handler";
import { decodeAndVerifyToken, isTokenInvalidated } from "../../general/helpers/jwt-helper";
import { UserAccountJwtPayload } from "../../types/UserAccountJwtPayload";
import { authConfig } from "../../config";
import createHttpError from "http-errors";

export async function requireAccessToken(req: Request, res: Response, next: NextFunction): Promise<void> {
	const accessToken: string = req.cookies.accessToken;
	const publicKey: string = authConfig.token.accessToken.publicKey;

	try {
		if (!accessToken) {
			throw createHttpError(400, "Missing access-token");
		}

		if (await isTokenInvalidated(accessToken)) {
			throw createHttpError(403, "Logged out, please login again");
		}	

		const decoded = <UserAccountJwtPayload>decodeAndVerifyToken(accessToken, publicKey);
		if (!decoded) {
			throw createHttpError(403, "Unauthorized access-token, please refresh session/login again");
		}

		req.body.decodedAccessTokenPayload = decoded;
		next();

	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

export async function requireRefreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
	const refreshToken: string = req.cookies.refreshToken;
	const publicKey: string = authConfig.token.refreshToken.publicKey;
	try {
		if (!refreshToken) {
			throw createHttpError(400, "Missing refresh token");
		}
		
		if (await isTokenInvalidated(refreshToken)) {
			throw createHttpError(403, "Logged out, please login again");
		}	

		const decoded = <UserAccountJwtPayload>decodeAndVerifyToken(refreshToken, publicKey);
		if (!decoded) {
			throw createHttpError(401, "Unauthorized refresh-token")
		}

		// Inject the decoded payload of the token into the request body so the subsequent handlers don't have to query for it
		req.body.decodedRefreshTokenPayload = decoded;
		next();
		
	} catch (err) {
		errorHandler(err, req, res, next);
	}
}