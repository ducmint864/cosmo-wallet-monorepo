import express, { NextFunction } from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "./auth-module";
import { queryRouter } from "./query-module";
import { transactionRouter } from "./transaction-module";
import { join } from "path";
import "dotenv/config";
import https from "https";
import fs from "fs";
import cors from "cors";
import helmet from "helmet";

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

const frontendPath: string = process.env.FRONTEND_PATH;
if (!frontendPath) {
	console.error("Env error: front-end static folder path not configured");
	process.exit(1);
}

const port = 3000;
const root = "/api";
const app = express();

// (CORS) config CORS policy
const corsOptions = {
	credentials: true, // Allow credentials to be attached to reponse
}

// (XSS) Instruct browsers to display/execute resources from these trusted sources only:
const helmetCspOptions = {
	directives: {
		scriptsrc: ["'self'"], // Client can only execute scripts issued by this web-server
	}
}

// Middlewares
app.use(cors(corsOptions));
app.use(helmet.contentSecurityPolicy(helmetCspOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.static(frontendPath));

app.use(`${root}/auth`, authRouter);
app.use(`${root}/query`, queryRouter);
app.use(`${root}/transaction`, transactionRouter);
app.get('/', (req, res) => {
	res.sendFile(join(frontendPath, "index.html"));	 // Serve the front-end GUI
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