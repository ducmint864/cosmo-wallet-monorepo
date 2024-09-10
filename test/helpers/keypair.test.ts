import { expect } from "@jest/globals";
import { Algorithm } from "jsonwebtoken";
import { _genTokenKeyPair } from "./keypair";
import { genToken } from "../../src/general/helpers/jwt-helper";
import { UserAccountJwtPayload } from "../../src/types/UserAccountJwtPayload";
import { authConfig } from "../../src/config";

describe("_genTokenKeyPair", () => {
	it("not throw error with any type of signing algorithm except HMAC and 'none'", () => {
		const signingAlgos: Algorithm[] = [
			"RS256",
			"RS384",
			"RS512",
			"ES256",
			"ES384",
			"ES512",
			"PS256",
			"PS384",
			"PS512",
		];

		signingAlgos.forEach((algo) => {
			expect(() => _genTokenKeyPair(algo)).not.toThrow();
		});
	});

	it("throw error if encounter HMAC or 'none'", () => {
		const signingAlgos: Algorithm[] = [
			"HS256",
			"HS384",
			"HS512",
			"none"
		];

		signingAlgos.forEach((algo) => {
			expect(() => _genTokenKeyPair(algo)).toThrow("unsupported signing algorithm");
		});
	});

	it("generate key pairs that are non-falsy with every signing algorithm except HMAC and 'none'", () => {
		const signingAlgos: Algorithm[] = [
			"RS256",
			"RS384",
			"RS512",
			"ES256",
			"ES384",
			"ES512",
			"PS256",
			"PS384",
			"PS512",
		];
		signingAlgos.forEach((algo) => {
			const { publicKey, privateKey } = _genTokenKeyPair(algo);
			expect(publicKey).not.toBeFalsy();
			expect(privateKey).not.toBeFalsy();
		});
	});

	it("generate key pair that can be used to sign jwt tokens", () => {
		const signingAlgos: Algorithm[] = [
			"RS256",
			"RS384",
			"RS512",
			"ES256",
			"ES384",
			"ES512",
			"PS256",
			"PS384",
			"PS512",
		];

		signingAlgos.forEach((algo) => {
			const { privateKey } = _genTokenKeyPair(algo);
			const payload: UserAccountJwtPayload = {
				userAccountId: 1,
				// userRole: "normal",
				userType: "normal",
			};

			expect(() => genToken(
				payload,
				privateKey,
				authConfig.token.accessToken.durationStr,
				algo
			)).not.toThrow();

		    const token: string = genToken(
				payload,
				privateKey,
				authConfig.token.accessToken.durationStr,
				algo
			)
			console.log(token);

			expect(() => genToken(
				payload,
				privateKey,
				authConfig.token.refreshToken.durationStr,
				algo
			)).not.toThrow();
		});
	});
});