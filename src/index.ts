import express from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "./auth-module";
import "dotenv/config";
import https from "https";
import fs from "fs";

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

app.use(express.json());
app.use(cookieParser());


app.use(`${root}/auth`, authRouter);
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