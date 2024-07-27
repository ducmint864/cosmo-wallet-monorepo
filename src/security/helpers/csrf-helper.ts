import { randomBytes, createHmac } from "crypto";
import { cryptoConfig, securityConfig } from "../../config";
import createHttpError from "http-errors";

function genCsrfToken(accessToken: string, randomValue?: string): string {
	if (!accessToken) {
		throw createHttpError(400, "Access-token is required to generate csrf-token");
	}

	if (!randomValue) {
		randomValue =  randomBytes(16).toString(cryptoConfig.binToTextEncoding);
	}
	
	// Gen csrf-token that is bound to access-token 
	const rawToken: string = accessToken.concat("@", randomValue);

	// Sign csrf-token
	let signedToken: string = createHmac(
		cryptoConfig.hmac.algorithm,
		securityConfig.csrf.csrfToken.secret
	).update(rawToken)
	.digest(cryptoConfig.binToTextEncoding);
	signedToken = signedToken.concat(".", randomValue); // Attach original random bytes to later verify the hash

	return signedToken;
}

function parseCsrfToken(csrfToken: string): { hashDigest: string, randomValue: string } {
	const splitted: string[] = decodeURIComponent(csrfToken).split(".");
	if (splitted.length !== 2) {
		throw createHttpError(400, "Unrecognizable csrf-token format");
	}

	if (!splitted[0]) {
		throw createHttpError(400, "Invalid Hmac digest of csrf-token");
	}

	if (!splitted[1]) {
		throw createHttpError(400, "Invalid random bytes value of csrf-token");
	}

	return {
		hashDigest: splitted[0],
		randomValue: (splitted[1]) // URL decode the randomValue
	};
}

function isValidCsrfToken(accessToken: string, csrfToken: string): boolean {
	const { randomValue } = parseCsrfToken(csrfToken);

	// Re-produce hash digest
	const testCsrfToken: string = genCsrfToken(accessToken, randomValue);

	return testCsrfToken === csrfToken;
}

export {
	genCsrfToken,
	isValidCsrfToken,
};
