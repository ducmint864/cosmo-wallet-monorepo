import jwt from "jsonwebtoken";
import { redisClient } from "../connections";
import { UserAccountJwtPayload } from "../types/BaseAccountJwtPayload";
import "dotenv/config";

export function genToken(payload: UserAccountJwtPayload, secret: string, duration: string): string {
	const options = {
		expiresIn: duration
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

export async function blackListToken(token: string, tokenPayload: UserAccountJwtPayload): Promise<void>	 {
	if (!tokenPayload.exp) {
		throw new Error("Token payload doesn't have expiry field");
	}

	try {
		const redisKeyDurationSecs: number = tokenPayload.exp - Math.floor(Date.now() / 1000);
		const res = await redisClient.set(token, "black-listed", {
			EX: redisKeyDurationSecs,
		});
		// console.log(res);
	} catch (err) {
		throw err;
	}
}

