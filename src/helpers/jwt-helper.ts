import jwt, { JwtPayload } from "jsonwebtoken";
import "dotenv/config";

export interface baseAccountPayload {
    username: string,
    email: string,
}

export function genToken(payload: baseAccountPayload, secret: string, duration: string): string {
	const options = {
		expiresIn: duration
	};
	const token = jwt.sign(payload, secret, options);
	return token;
}

export function decodeAndVerifyToken(token: string, secret: string): JwtPayload | Error {
	try {
		const decoded = jwt.verify(token, secret);
		return <baseAccountPayload>(decoded);
	} catch (err) {
		return err;
	}
}