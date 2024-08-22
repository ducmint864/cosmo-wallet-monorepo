import { BinaryToTextEncoding } from "crypto";
import { Algorithm } from "jsonwebtoken";
import { envCollection } from "./env";

type MnemonicLength = 12 | 15 | 18 | 21 | 24;

const authConfig = {
	token: {
		accessToken: {
			privateKey: envCollection.ACCESS_TOKEN_PRIVATE_KEY,
			publicKey: envCollection.ACCESS_TOKEN_PUBLIC_KEY,
			durationStr: "5m",
			durationMinutes: 5,
			signingAlgo: "ES256" as Algorithm,
		},
		refreshToken: {
			privateKey: envCollection.REFRESH_TOKEN_PRIVATE_KEY,
			publicKey: envCollection.REFRESH_TOKEN_PUBLIC_KEY,
			durationStr: "4h",
			durationMinutes: 60 * 4,
			signingAlgo: "ES384" as Algorithm,
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

const chainRpcConfig = {
	http: {
		blockchainApp: {
			minNodes: 1,
			maxNodes: 50,
			endpoints: envCollection.BLOCKCHAIN_APP_HTTP_ENDPOINTS,
		},
		cometBft: {
			minNodes: 1,
			maxNodes: 20,
			endpoints: envCollection.COMET_BFT_HTTP_ENDPOINTS,
		}
	},
	cometBftWebSocket: {
		minNodes: 1,
		maxNodes: 5,
		endpoints: envCollection.COMET_BFT_WEBSOCKET_ENDPOINTS,
	},
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
			secret: envCollection.CSRF_TOKEN_SECRET,
			length: 16,
			durationMinutes: 60 * 4,
		},
	},
	csp: {
		policies: {
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-eval, unsafe-inline unsafe in production, change it!
				styleSrc: ["'self'", "'unsafe-inline'"], // Unsafe for production
				imageSrc: ["'self'"],
				connectSrc: ["'self'"],
			}
		},
	}
}

const txConfig = {
	bank: {
		db: {
			saveTxDbTimeoutMilisecs: 105000,
		}
	}
}

export {
	cryptoConfig,
	authConfig,
	chainRpcConfig,
	requestDataConfig,
	securityConfig,
	txConfig,
};