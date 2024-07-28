import jwt from "jsonwebtoken";
import { redisClient } from "../../connections";
import { UserAccountJwtPayload } from "../../types/BaseAccountJwtPayload";
import "dotenv/config";
import { authConfig, cryptoConfig } from "../../config";

export function genToken(payload: UserAccountJwtPayload, secret: string, duration: string): string {
	payload.iat = Math.floor(Date.now() / 1000); // Manually set the timestamp to ensure integrity across modules that use UserAccountJwtPayload
	const options = {
		expiresIn: duration,
		// algorithm: authConfig.token.signingAlgo, // To be implemented later
	};
	const token = jwt.sign(payload, secret, options);
	return token;
}

export function decodeAndVerifyToken(token: string, secret: string): UserAccountJwtPayload {
	try {
		const decoded = <UserAccountJwtPayload>jwt.verify(token, secret);
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
export async function isTokenBlackListed(token: string): Promise<boolean> {
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

export async function invalidateToken(token: string, tokenPayload: UserAccountJwtPayload): Promise<void>	 {
	if (!tokenPayload.exp) {
		throw new Error("Token payload doesn't have expiry field");
	}

	try {
		const remainingTTL: number = tokenPayload.exp - Math.floor(Date.now() / 1000);
		const res = await redisClient.set(token, "black-listed", {
			EX: remainingTTL,
		});
		// console.log(res);
	} catch (err) {
		throw err;
	}
}

