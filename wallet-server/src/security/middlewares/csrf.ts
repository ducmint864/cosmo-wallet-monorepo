import { randomBytes, createHmac } from "crypto";
import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import { authConfig, cryptoConfig, securityConfig } from "../../config";
import { errorHandler } from "../../errors/middlewares/error-handler";
import { isValidCsrfToken } from "../helpers/csrf-helper";
import { UserAccountJwtPayload } from "../../types/UserAccountJwtPayload";


function sendCsrfToken(req: Request, res: Response, next: NextFunction): void {
	// if (req.headers["x-csrf-token"]) {
	// 	next();
	// }

	// const token: string = randomBytes(20).toString("hex");

	// try {
	// 	const signedToken = createHmac(
	// 		cryptoConfig.hmac.algorithm,
	// 		securityConfig.csrf.csrfToken.secret
	// 	).update(token).digest("hex");

	// 	res.cookie("csrfToken", signedToken, {
	// 		httpOnly: false,
	// 		secure: true,
	// 		sameSite: "strict",
	// 		maxAge: authConfig.session.durationMinutes
	// 	})

	// 	next();
	// } catch (err) {
	// 	errorHandler(err, req, res, next);
	// }
}

// const 

function requireCsrfToken(req: Request, res: Response, next: NextFunction): void {
	// let csrfToken: string | string[] = req.headers["x-csrf-token"];

	// try {
	// 	if (!csrfToken) {
	// 		throw createHttpError(400, "Missing x-csrf-token field in request header");
	// 	}

	// 	if (Array.isArray(csrfToken)) {
	// 		throw createHttpError(400, "Multiple x-csrf-token values found in request headers");
	// 	}

	// 	const userPayload: UserAccountJwtPayload = req.body["decodedAccessTokenPayload"];

	// 	if (!userPayload) {
	// 		throw createHttpError(403, "User payload is required is required for verifying csrf-token");
	// 	}

	// 	// Decode URI-encoded csrfToken cookie
	// 	csrfToken = decodeURIComponent(csrfToken);

	// 	// Verify csrf-token
	// 	const isValid: boolean = isValidCsrfToken(userPayload, csrfToken);
	// 	if (!isValid) {
	// 		throw createHttpError(403, "Unauthorized csrf-token");
	// 	}

		next();
	// } catch (err) {
	// 	errorHandler(err, req, res, next);
	// }
}

export {
	sendCsrfToken,
	requireCsrfToken,
};
