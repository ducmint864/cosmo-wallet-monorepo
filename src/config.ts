import 'dotenv/config';

const config = {
    crypto: {
        bip44: {
            defaultHdPath: "m/44'/0'/0'/0/0" // borrow that of bitcoin for now
        }
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
}

export default config;