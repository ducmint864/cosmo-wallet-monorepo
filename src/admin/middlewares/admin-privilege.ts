import { role_enum } from "@prisma/client";
import { NextFunction } from "express";
import { UserAccountJwtPayload } from "../../types/UserAccountJwtPayload";
import createHttpError from "http-errors";
import { errorHandler } from "../../errors/middlewares/error-handler";

/**
 * @notice This middleware must be preceded by either requireAccessToken middleware
 * @param req 
 * @param res 
 * @param next 
 */
async function requireAdminRole(
	req: any,
	res: any,
	next: NextFunction
): Promise<void> {
	const accessTokenPayload: UserAccountJwtPayload = req.body["decodedAccessTokenPayload"];
	try {

		if (!accessTokenPayload) {
			throw createHttpError(403, "requireUserTypeAdmin(): access-token payload not found");
		}

		if (accessTokenPayload.userRole !== role_enum.admin) {
			throw createHttpError(403, "requireUserTypeAdmin(): user is not an admin");
		}

		next();
	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

export {
	requireAdminRole,
}

