import "dotenv/config";
import authRouter from "./routes/auth";

const config = {
	crypto: {
		bip44: {
			defaultHdPath: "m/44'/0'/0'/0/0" // borrow that of bitcoin for now
		},
		aes: {
			algorithm: "aes-256-cbc"
		},
		encoding: "base64" as BufferEncoding
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