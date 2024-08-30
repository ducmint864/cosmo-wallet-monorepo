import jwt, { Algorithm } from "jsonwebtoken";
import { redisClient } from "../../connections";
import { UserAccountJwtPayload } from "../../types/UserAccountJwtPayload";
import { role_enum } from "@prisma/client";
import { authConfig } from "../../config";
import "dotenv/config";

function genAndTimestampPayload(inputUserAccountId: number, inputUserRole: role_enum): UserAccountJwtPayload {
	// Manually set the timestamp to ensure integrity across modules that use UserAccountJwtPayload
	const argTimestamp: number = Math.floor(Date.now() / 1000);
	const payload: UserAccountJwtPayload = {
		userAccountId: inputUserAccountId,
		userRole: inputUserRole,
		iat: argTimestamp,
	}
	return payload;
}

function genToken(
	payload: UserAccountJwtPayload,
	secret: string,
	duration: string,
	signingAlgo?: Algorithm
): string {
	payload.iat = Math.floor(Date.now() / 1000); // Manually set the timestamp to ensure integrity across modules that use UserAccountJwtPayload

	const defaultSigningAlgo: Algorithm = "ES256";
	const options = {
		expiresIn: duration,
		algorithm: signingAlgo ?? defaultSigningAlgo,
	};
	const token = jwt.sign(payload, secret, options);
	return token;
}

function decodeAndVerifyToken(token: string, publicKey: string): UserAccountJwtPayload | null {
	try {
		const decoded = <UserAccountJwtPayload>jwt.verify(token, publicKey);
		if (!decoded) {
			return null;
		}
		return decoded;
	} catch (err) {
		return null;
	}
}

/**
 * 
 * @param token: Raw token string
 * @returns 
 */
async function isTokenInvalidated(token: string): Promise<boolean> {
	try {
		if (!redisClient.isOpen) {
			redisClient.connect();
		}

		const data = await redisClient.get(token);
		return data !== null;
	} catch (err) {
		return false;
	}
}

async function invalidateToken(token: string, tokenPayload: UserAccountJwtPayload): Promise<void> {
	// Unix timestamp in seconds
	let expiryTimestamp: number = tokenPayload.iat;

	if (!expiryTimestamp) {
		// Asign expiry to the timestamp of n seconds from now, where n is the duration of refresh token
		const nSeconds: number = authConfig.token.refreshToken.durationMinutes * 60;
		expiryTimestamp = Date.now() / 1000 + nSeconds;
	}

	const remainingTTL: number = expiryTimestamp - Math.floor(Date.now() / 1000);
	await redisClient.set(token, "invalidated", {
		EX: remainingTTL,
	});
}

export {
	decodeAndVerifyToken,
	genToken,
	invalidateToken,
	isTokenInvalidated,
	genAndTimestampPayload,
}