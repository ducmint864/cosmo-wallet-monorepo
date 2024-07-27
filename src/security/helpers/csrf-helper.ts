import { randomBytes, createHmac,  } from "crypto";
import { cryptoConfig, securityConfig } from "../../config";
import createHttpError from "http-errors";

function genCsrfToken(accessToken: string): string {
	if (!accessToken) {
		throw createHttpError("Access-token is required to generate csrf-token");
	}

	// Gen csrf-token that is bound to access-token 
	const random: string = randomBytes(16).toString(cryptoConfig.binToTextEncoding);
	const rawToken: string = accessToken.concat("@", random);

	// Sign csrf-token
	const signedToken: string = createHmac(
		cryptoConfig.hmac.algorithm,
		securityConfig.csrf.csrfToken.secret
	).update(rawToken)
	.digest(cryptoConfig.binToTextEncoding);

	return signedToken;
}

export {
	genCsrfToken
};