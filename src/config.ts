import { BinaryToTextEncoding } from "crypto";
import { Algorithm } from "jsonwebtoken";
import { envCollection } from "./env";
import { getRedisKey } from "./general/helpers/redis-helper";

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

const codecConfig = {
	// stringReprFormat determines how binary data is represented as a string, 
	// with "base64" being the chosen format to prevent data corruption 
	// when storing data as a raw buffer in Redis due to its internal 
	// type buffer to string conversion.
	stringReprFormat: <BufferEncoding>"base64",
}

const txConfig = {
	db: {
		timeoutMilisecs: 600,
	},
	requests: {
		// maxRetries: 3,
		timeoutMilisecs: 2000,
	},
	txStream: {
		redisKey: getRedisKey("tx", "stream"),
		name: getRedisKey("tx", "stream"),
		txCountPerRead: 12, // how many tx payloads to read from stream at once
		consumerThread: {
			executableFile: "./build/transaction-module/helpers/tx-stream-consumer.js", // this path is relative the the project root
			nameKey: "thread-name",
			nameValue: "tx-stream-consumer",
			idKey: "thread-id",
		}
	},
	bank: {
	},
}

const logsConfig = {
	storage: {
		// directory to store the logs files
		relativeDir: "logs" // this dir is relative to the project's root dir (which should be the parent dir of the src/ dir)
	},
	customLevels: {
		levels: {
			fatal: 0,
			error: 1,
			warn: 2,
			info: 3,
			debug: 4,
			trace: 5,
		},
		colors: {
			// color codes reference: https://stackoverflow.com/questions/51012150/winston-3-0-colorize-whole-output-on-console
			fatal: "underline bold black redBG", // red
			error: "red", // red
			warn: "yellow", // yellow 
			info: "cyan", // cyan
			debug: "green", // green
			trace: "underline white", // white
		}
	}
}

export {
	cryptoConfig,
	authConfig,
	chainRpcConfig,
	requestDataConfig,
	securityConfig,
	codecConfig,
	txConfig,
	logsConfig,
};