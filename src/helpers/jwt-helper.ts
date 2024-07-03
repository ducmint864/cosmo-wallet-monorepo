import jwt, { JwtPayload } from "jsonwebtoken";
import { createClient } from "redis";
import "dotenv/config";

// Init redis client
let redisClient = createClient();
redisClient.on('error', (err: unknown) => console.log('Redis Client Error', err));

(async () => {
	await redisClient.connect();
})();



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

