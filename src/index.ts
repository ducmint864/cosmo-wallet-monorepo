import express from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "./auth-module";
import { queryRouter } from "./query-module";
import "dotenv/config";
import https from "https";
import fs from "fs";
import cors from "cors";

// Check environement
if (!process.env.ACCESS_TOKEN_SECRET) {
	console.error("Env error: access token secret not configured");
	process.exit(1);
}

if (!process.env.REFRESH_TOKEN_SECRET) {
	console.error("Env error: refresh token secret not configured");
	process.exit(1);
}

if (!process.env.DB_CONNECTION_STRING) {
	console.error("Env error: database connection string not configured");
	process.exit(1);
}

const port = 3000;
const root = "/api";
const app = express();

const corsOptions = {
	credentials: true, // Allow credentials to be attached to reponse
	origin: "http://localhost:3001", // front-end app
}
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());


app.use(`${root}/auth`, authRouter);
app.use(`${root}/query`, queryRouter);
app.get('/', (req, res) => {
	res.send("Hello world It's Thasa Wallet");
})

https.createServer(
	{
		key: fs.readFileSync("server.key"),
		cert: fs.readFileSync("server.cert"),
	},
	app
).listen(port, () => {
	console.log(`Server listening on port ${port}`);
});