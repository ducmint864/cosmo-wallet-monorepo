import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import { errorHandler } from "./errors/error-handler";
import { decodeAndVerifyToken } from "../helpers/jwt-helper";
import { prisma } from "../database/prisma";
import createError from "http-errors";
import config from "../config";

export const userAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		const token = req.cookies.accessToken;
		if (token) {
			const decoded = decodeAndVerifyToken(token, config.auth.accessToken.secret);
			if (decoded instanceof Error) {
				throw createError(400, "Unauthorized access token");
			} else {
				if (!(prisma.base_account.findFirst({
					where: {
						OR: [
							{ email: decoded.email },
							{ username: decoded.username }
						]
				}
				}))) {
					throw createError(401, "Unknown identity");
				}
				next();
			}
		} else {
			throw createError(400, "Missing jwt");
		}
	} catch (err) {
		errorHandler(err, req, res, next);
	}
};

export default userAuth;