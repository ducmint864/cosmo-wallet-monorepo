import { generateKeyPairSync } from "crypto";
import { Algorithm } from "jsonwebtoken";
import { authConfig } from "../../src/config";

/**
 * 
 * @param signingAlgo 
 * @returns name of curve (string)
 */
function getCurveFromSigningAlgo(signingAlgo: Algorithm): string {
	if (signingAlgo === "none") {
		return "";
	}

	if (signingAlgo.slice(0, 2) !== "ES") {
		// console.log("DEBUG: ", signingAlgo.slice(0, 2))
		return "";
	}

	if (signingAlgo.slice(2) === "512") {
		return "P-521";
	}

	return "P-".concat(signingAlgo.slice(2));
}

function _genRSAKeyPair(): {
	publicKey: string,
	privateKey: string,
} {
	const result = generateKeyPairSync('rsa', {
		modulusLength: 2048,
		publicKeyEncoding: {
			type: 'spki',
			format: 'pem'
		},
		privateKeyEncoding: {
			type: 'pkcs8',
			format: 'pem',
		}
	});

	return {
		publicKey: result.publicKey,
		privateKey: (result as any).privateKey,
	};
}

function _genECDSAKeyPair(signingAlgo: Algorithm): {
	publicKey: string,
	privateKey: string,
} {
	const curveName: string = getCurveFromSigningAlgo(signingAlgo);
	const { publicKey, privateKey } = generateKeyPairSync("ec", {
		namedCurve: curveName,
	});
	const publicKeyStr: string = (publicKey as any).export({ type: "spki", format: "pem" }).toString("base64");
	const privateKeyStr: string = (privateKey as any).export({ type: "pkcs8", format: "pem" }).toString("base64");

	return {
		publicKey: publicKeyStr,
		privateKey: privateKeyStr,
	};
}

function _genTokenKeyPair(signingAlgo: Algorithm): {
	publicKey: string,
	privateKey: string,
} {
	switch (signingAlgo.slice(0, 2)) {
		case "RS":
		case "PS":
			return _genRSAKeyPair();
		case "ES":
			return _genECDSAKeyPair(signingAlgo);
		default:
			throw new Error(`unsupported signing algorithm: ${signingAlgo}`);
	}
}

/**
 * 
 * Generate a public - private key pair used for signing access tokens
 * @returns public and private key pair
 */
function genAccessTokenKeyPair(): {
	publicKey: string,
	privateKey: string
} {
	const signingAlgo: Algorithm = authConfig.token.accessToken.signingAlgo;
	return _genTokenKeyPair(signingAlgo);
}

/**
 * 
 * Generate a public - private key pair used for signing refresh tokens
 * @returns public and private key pair
 */
function genRefreshTokenKeyPair(): {
	publicKey: string,
	privateKey: string,
} {
	const signingAlgo: Algorithm = authConfig.token.refreshToken.signingAlgo;
	return _genTokenKeyPair(signingAlgo);
}

export {
	genAccessTokenKeyPair,
	genRefreshTokenKeyPair,
	_genTokenKeyPair,
}
