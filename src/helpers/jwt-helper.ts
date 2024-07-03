import jwt, { JwtPayload } from "jsonwebtoken";
import * as redis from "redis";
import "dotenv/config";

// Init client for redis in-memory db
const redisClient = redis.createClient();

export interface baseAccountIdentifier {
	username: string,
	email: string,
}

export function genToken(payload: baseAccountIdentifier, secret: string, duration: string): string {
	const options = {
		expiresIn: duration
	};
	const token = jwt.sign(payload, secret, options);
	return token;
}

export function decodeAndVerifyToken(token: string, secret: string): JwtPayload {
	try {
		const decoded = jwt.verify(token, secret);
		return <JwtPayload>decoded;
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
		const data = await redisClient.get(token);
		return data !== null;
	} catch (err) {
		console.log(err);
		return false;
	}
}

export async function blackListToken(token: string, redisKeyExpiry: number) {
	try {
		const res = await redisClient.set(token, "black-listed", {
			EX: redisKeyExpiry
		});
		// console.log(res);
	} catch (err) {
		throw err;
	}
}