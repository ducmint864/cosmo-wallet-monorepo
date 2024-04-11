import "dotenv/config";
import authRouter from "./routes/auth";

type MnemonicLength = 12 | 15 | 18 | 21 | 24;

const config = {
	crypto: {
		bip39: {
			mnemonicLength: <MnemonicLength>24
		},
		bip44: {
			defaultHdPath: "m/44'/0'/0'/0/0" // borrow that of bitcoin for now
		},
		aes: {
<<<<<<< HEAD
			algorithm: "aes-256-cbc"
=======
			algorithm: "aes-256-cbc",
			ivLength: 16
>>>>>>> ducminh-test
		},
		bech32: {
			prefix: "thasa",
		},
		bcrypt: {
			saltRounds: 10
		},
		pbkdf2: {
<<<<<<< HEAD
			iterations: 1000
=======
			algorithm: "sha512",
			iterations: 1000,
			keyLength: 32,
			saltLength: 32

>>>>>>> ducminh-test
		},
		encoding: "base64" as BufferEncoding,
	},
	auth: {
		accessToken: {
			secret: process.env.ACCESS_TOKEN_SECRET,
			duration: "10m" 
		},
		refreshToken: {
			secret: process.env.REFRESH_TOKEN_SECRET,
			duration: "14d"
		}
	}
};

export default config;