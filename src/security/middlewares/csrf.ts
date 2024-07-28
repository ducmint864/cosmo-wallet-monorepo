import { randomBytes, createHmac } from "crypto";
import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import { authConfig, cryptoConfig, securityConfig } from "../../config";
import { errorHandler } from "../../errors/middlewares/error-handler";
import { isValidCsrfToken } from "../helpers/csrf-helper";


function sendCsrfToken(req: Request, res: Response, next: NextFunction): void {
	if (req.headers["x-csrf-token"]) {
		next();
	}

	const token: string = randomBytes(20).toString("hex");

	try {
		const signedToken = createHmac(
			cryptoConfig.hmac.algorithm,
			securityConfig.csrf.csrfToken.secret
		).update(token).digest("hex");

		res.cookie("csrfToken", signedToken, {
			httpOnly: false,
			secure: true,
			sameSite: "strict",
			maxAge: authConfig.session.durationMinutes
		})

		next();
	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

// const 

function requireCsrfToken(req: Request, res: Response, next: NextFunction): void {
	let csrfToken: string | string[] = req.headers["x-csrf-token"];

	try {
		if (Array.isArray(csrfToken)) {
			throw createHttpError(400, "Multiple x-csrf-token values found in request headers");
		}


		if (!csrfToken) {
			throw createHttpError(400, "Missing x-csrf-token field in request header");
		}

		const accessToken: string = req.cookies["csrfToken"];
		if (!accessToken) {
			throw createHttpError(403, "Access-token is required");
		}

		// Decode URI-encoded csrfToken cookie
		csrfToken = decodeURIComponent(csrfToken);

		// Verify csrf-token
		const isValid = isValidCsrfToken(accessToken, csrfToken);
		if (!isValid) {
			throw createHttpError(403, "Unauthorized csrf-token");
		}

		next();
	} catch (err) {
		errorHandler(err, req, res, next);
	}

}

export {
	sendCsrfToken,
	requireCsrfToken,
};
