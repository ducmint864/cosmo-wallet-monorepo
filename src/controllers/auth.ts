import { NextFunction, Request, Response } from "express";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { prisma } from "../database/prisma";
import { errorHandler } from "../middlewares/errors/error-handler";
import { baseAccountPayload } from "../helpers/jwt-helper";
import { genToken, decodeAndVerifyToken } from "../helpers/jwt-helper";
import jwt  from 'jsonwebtoken';
import config from "../config";
import createError from "http-errors";
import bcrypt from "bcrypt";
import crypto from "crypto";
import "dotenv/config";

function checkEmailFormat(email: string): void {
	if (email) {
		if (false) {
			throw createError(400, "Invalid email");
		}
	}
}

function checkUsernameFormat(username: string): void {
	if (username) {
		if (false) {
			throw createError(400, "Invalid username");
		}
	}
}

function checkPasswordFormat(password: string): void {
	if (password) {
		if (false) {
			throw createError(400, "Invalid password");
		}
	}
}

function genUsername(): string {
	return `${Math.random().toString(36)}`;
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		let { email: _email, username: _username, password: _password  } = req.body;

		if (!(_email && _password)) {
			throw createError(400, "Missing credentials information");
		}

		// Credential format validation
		checkEmailFormat(_email);
		checkPasswordFormat(_password);
		if (_username) {
			checkUsernameFormat(_username);
		} else {
			_username = genUsername();
		}

		// Password-hashing
		const hashedPassword = await bcrypt.hash(_password, 10);

		// Encrypt mnemonic
		const wallet = DirectSecp256k1HdWallet.generate(24, {
			prefix: "thasa"
		});

		/**
         * 
         * @done generate encryptionKey with pbkdf2 algo based on user's email and username
         * @todo generate mnemonic, create a default derived_account for user on registration: 
         */
		const mnemonic = "test test test test test test test test test test test test"; // mock
		const encryptionKey = crypto.pbkdf2Sync(_password, `${_email}${_username}`, 1000, 32, "sha512");
		const cipher = crypto.createCipheriv("aes-256-ecb", encryptionKey, null);
		let encryptedMnemonic = cipher.update(mnemonic, "utf8", "hex");
		encryptedMnemonic += cipher.final("hex");

		const ba = await prisma.base_account.create({
			data: {
				email: _email,
				username: _username,
				password: hashedPassword,
				mnemonic: encryptedMnemonic
			}
		});
        
		if (!ba) {
			throw createError(500, "Failed to create account");
		}
        
		const _address = "thasa231412345152hj235125"; // mockr
		const da = await prisma.derived_account.create({
			data: {
				address: _address,
				hd_path: config.crypto.bip44.defaultHdPath,
				base_acc_id: ba.base_acc_id
			}
		});

		res.status(201).json({
			message: "Register successful",
		});
	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { email: _email, username: _username, password: _password } = req.body;
		if (!((_email || _username) && _password)) {
			throw createError(400, "Missing credentials information");
		}

		// Quick validation
		checkEmailFormat(_email);
		checkUsernameFormat(_username);
		checkPasswordFormat(_password);

		// Validate login credentials
		const ba = await prisma.base_account.findFirst({
			where: {
				OR: [
					{ email: _email },
					{ username: _username }
				]
			}
		});
		if (!ba) {
			throw createError(401, "Invalid login credentials");
		}

		if (!(await bcrypt.compare(
			_password,
			ba.password
		))) {
			throw createError(401, "Invalid login credentials");
		}

		// Send access token and refresh token
		const payload = <baseAccountPayload>{
			email: _email,
			username: _username
		};
		const accessToken = genToken(payload, config.auth.accessToken.secret, config.auth.accessToken.duration);
		const refreshToken = genToken(payload, config.auth.refreshToken.secret, config.auth.refreshToken.duration);

		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: true,
			maxAge: 10 * 60 * 1000 // 10 mins in milisecs
		});

		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: true,
			maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days in milisecs
		});
        
		res.status(200).json({
			message: "Login sucessful"
		});

	} catch (err) {
		errorHandler(err, req, res, next);
	}
}


// This function lets user send their refresh token then verify if the refresh token is valid to get a new access token
export async function retrieveNewToken(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		// Extract the refresh token from the request
		const refreshToken = req.cookies.refreshToken;

		// Check if the refresh token is provided
		if (!refreshToken) {
			throw createError(400, "Missing refresh token");
		}

		// Verify the refresh token and extract the payload (e.g., email, username)
		const decoded = decodeAndVerifyToken(refreshToken, config.auth.refreshToken.secret);

		// Check if the refresh token is valid
		if (decoded instanceof Error) {
			throw createError(401, "Invalid refresh token");
		}

		const newPayload = {
			email: decoded.email,
			username: decoded.username,
		}
		// Generate a new access token using the payload
		const accessToken = genToken(newPayload, config.auth.accessToken.secret, config.auth.accessToken.duration);

		// Send the new access token to the client
		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: true,
			maxAge: 10 * 60 * 1000 // 10 mins in milliseconds
		});

		res.status(200).json({
			message: "New access token generated successfully"
		});
	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

