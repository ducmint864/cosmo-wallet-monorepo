import jwt, { Algorithm } from "jsonwebtoken";
import { redisClient } from "../../connections";
import { UserAccountJwtPayload } from "../../types/UserAccountJwtPayload";
import "dotenv/config";
import { user_type_enum } from "@prisma/client";

function genAndTimestampPayload(inputUserAccountId: number, inputUserType: user_type_enum): UserAccountJwtPayload {
	// Manually set the timestamp to ensure integrity across modules that use UserAccountJwtPayload
	const argTimestamp: number = Math.floor(Date.now() / 1000); 
	const payload: UserAccountJwtPayload = {
		userAccountId: inputUserAccountId,
		userType: inputUserType,
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

export function decodeAndVerifyToken(token: string, publicKey: string): UserAccountJwtPayload | null {
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
		console.log(err);
		return true;
	}
}

async function invalidateToken(token: string, tokenPayload: UserAccountJwtPayload): Promise<void>	 {
	if (!tokenPayload.exp) {
		throw new Error("Token payload doesn't have expiry field");
	}

	try {
		const remainingTTL: number = tokenPayload.exp - Math.floor(Date.now() / 1000);
		await redisClient.set(token, "invalidated", {
			EX: remainingTTL,
		});
	} catch (err) {
		throw err;
	}
}

export {
	decodeAndVerifyToken,
	genToken,
	invalidateToken,
	isTokenInvalidated,
	genAndTimestampPayload,
}