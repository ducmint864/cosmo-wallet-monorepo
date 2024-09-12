import { randomBytes, createHmac } from "crypto";
import { cryptoConfig, securityConfig } from "../../config";
import { UserAccountJwtPayload } from "../../types/UserAccountJwtPayload";
import createHttpError from "http-errors";

function genCsrfToken(
	userPayload: UserAccountJwtPayload,
	randomValue?: string
): string {
	if (!userPayload) {
		throw createHttpError(400, "User info payload is required for generating csrf-token");
	}

	if (!userPayload.iat) {
		throw createHttpError(500, "Invalid timestamp of user payload");
	}

	if (!randomValue) {
		randomValue = randomBytes(16).toString(cryptoConfig.binToTextEncoding);
	}

	const timestamp: string = userPayload.iat.toString();
	const userAccountId: string = userPayload.userAccountId.toString();
	const message: string = userAccountId.concat("@", timestamp, "@", randomValue);

	const hashDigest: string = createHmac(
		cryptoConfig.hmac.algorithm,
		securityConfig.csrf.csrfToken.secret
	).update(message)
		.digest(cryptoConfig.binToTextEncoding);

	const token: string = hashDigest.concat(".", message);
	return token;
}

function parseCsrfToken(csrfToken: string): {
	hashDigest: string,
	userAccountId: string,
	timestamp: string,
	randomValue: string
} {
	const splitted: string[] = decodeURIComponent(csrfToken).split(".");
	const hashDigest: string = splitted[0];
	const message: string = splitted[1];

	if (splitted.length !== 2) {
		throw createHttpError(400, "Unrecognizable csrf-token format");
	}

	if (!splitted[0]) {
		throw createHttpError(400, "Invalid hmac digest of csrf-token");
	}

	if (!splitted[1]) {
		throw createHttpError(400, "Invalid message of csrf-token");
	}

	// Parse message values
	const msgSplit: string[] = message.split("@");
	if (msgSplit.length !== 3) {
		throw createHttpError(400, "Unrecognizable message format of csrf-token");
	}

	const [userAccountId, timestamp, randomValue] = msgSplit;
	if (!userAccountId || !timestamp || !randomValue) {
		throw createHttpError(400, "Invalid value of message in csrf-token");
	}

	return {
		hashDigest: hashDigest,
		userAccountId: userAccountId,
		timestamp: timestamp,
		randomValue: randomValue
	};
}

function isValidCsrfToken(
	userPayload: UserAccountJwtPayload,
	csrfToken: string
): boolean {
	const { randomValue } = parseCsrfToken(csrfToken);

	// Re-produce csrf-token
	const testToken: string = genCsrfToken(userPayload, randomValue);
	return testToken === csrfToken;
}

export {
	genCsrfToken,
	isValidCsrfToken,
	parseCsrfToken,
};
