import { BinaryToTextEncoding } from "crypto";
import { Algorithm } from "jsonwebtoken";
import "dotenv/config";

type MnemonicLength = 12 | 15 | 18 | 21 | 24;

const authConfig = {
	token: {
		// signingAlgo: "RS512" as Algorithm, // Implement this later (requires asymmetric key pair)
		accessToken: {
			secret: process.env.ACCESS_TOKEN_SECRET,
			durationStr: "5m",
			durationMinutes: 5,
		},
		refreshToken: {
			secret: process.env.REFRESH_TOKEN_SECRET,
			durationStr: "4h",
			durationMinutes: 60 * 4,
		},
	},
	password: {
		minLength: 8,
		maxLength: 32,
	},
	username: {
		minLength: 6,
		maxLength: 16
	},
	nickname: {
		minLength: 1,
		maxLength: 16
	},
	session: {
		durationMinutes: 60 * 4,
	},
}

const cryptoConfig = {
	encoding: "base64" as BufferEncoding,
	binToTextEncoding: "base64" as BinaryToTextEncoding,
	bip39: {
		mnemonicLength: <MnemonicLength>24
	},
	bip44: {
		defaultHdPath: "m/44'/0'/0'/0/0" // borrow that of bitcoin for now
	},
	aes: {
		algorithm: "aes-256-cbc",
		ivLength: 16
	},
	bech32: {
		prefix: "thasa",
	},
	bcrypt: {
		saltRounds: 10
	},
	pbkdf2: {
		algorithm: "sha512",
		iterations: 1000,
		keyLength: 32,
		saltLength: 32
	},
	hmac: {
		algorithm: "sha-256",
	}
}

const webSocketConfig = {
	client: {
		minClientCount: 0,
		maxClientCount: 5,
	}
}

const chainNodeConfig = {
	minNodeCount: 0,
	maxNodeCount: 100,
}

const requestDataConfig = {
	objects: {
		maxNestLevel: 7,
	}
}

const securityConfig = {
	xss: {},
	csrf: {
		csrfToken: {
			secret: process.env.CSRF_TOKEN_SECRET,
			length: 16,
			durationMinutes: 60 * 4,
		},
	},
}

export {
	cryptoConfig,
	authConfig,
	webSocketConfig,
	chainNodeConfig,
	requestDataConfig,
	securityConfig,
};