import { NextFunction, Request, Response } from "express";
import { ThasaHdWallet} from "../helpers/ThasaHdWallet";
import { stringToPath } from "@cosmjs/crypto";
import { prisma } from "../database/prisma";
import { errorHandler } from "../middlewares/errors/error-handler";
import { baseAccountPayload } from "../helpers/jwt-helper";
import { genToken, decodeAndVerifyToken } from "../helpers/jwt-helper";
import { getDerivedAccount, makeHDPath } from "../helpers/crypto-helper";
import jwt, { JwtPayload }  from 'jsonwebtoken';
import { encrypt, isValidPassword } from "../helpers/crypto-helper";
import config from "../config";
import createError from "http-errors";
import bcrypt from "bcrypt";
import { randomBytes, pbkdf2 } from "crypto";
import "dotenv/config";

function checkEmailAndThrow(email: string): void {
	if (!email) {
		throw createError(400, "Missing email");
	}
}

function checkUserNameAndThrow(username: string): void {
	if (username) {
		if (false) {
			throw createError(400, "Invalid username");
		}
	}
}

function checkPasswordAndThrow(password: string): void {
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

		// Check if request contains required params
		if (!(_email && _password)) {
			throw createError(400, "Missing credentials information");
		}

		// Quick validation
		checkEmailAndThrow(_email);
		checkPasswordAndThrow(_password);
		if (_username) {
			checkUserNameAndThrow(_username);
		} else {
			_username = genUsername();
		}


		// Encrypt mnemonic
		const wallet = await ThasaHdWallet.generate(config.crypto.bip39.mnemonicLength, {
			prefix: config.crypto.bech32.prefix,
			hdPaths: [stringToPath(config.crypto.bip44.defaultHdPath)]
		});

		const mnemonic = wallet.mnemonic;
		const _pbkdf2Salt = Buffer.concat([Buffer.from(`${_email}${_username}`), randomBytes(config.crypto.pbkdf2.saltLength)]);
		const encryptionKey = await new Promise<Buffer>((resolve, reject) => pbkdf2(
			_password,
			_pbkdf2Salt,
			config.crypto.pbkdf2.iterations,
			config.crypto.pbkdf2.keyLength,
			config.crypto.pbkdf2.algorithm,
			(err, key) => {
				if (err) {
					reject(createError(500, err));
				}
				resolve(key);
			}
		));
		const { encrypted: _mnemonic, iv: _iv } = encrypt(mnemonic, encryptionKey);
		
		// Password-hashing
		_password = await bcrypt.hash(_password, config.crypto.bcrypt.saltRounds);

		const ba = await prisma.base_account.create({
			data: {
				email: _email,
				username: _username,
				password: _password,
				mnemonic: _mnemonic,
				iv: _iv,
				pbkdf2_salt: _pbkdf2Salt
			}
		});
        
		if (!ba) {
			throw createError(500, "Failed to create account");
		}
        

		// Derive the default account for base account
		const { address: _address, privkey } = (await wallet.getAccountsWithPrivkeys())[0];
		const _hdPath = config.crypto.bip44.defaultHdPath;
		const { encrypted: _privkey, iv: _privkeyIv } = encrypt(
			Buffer.from(privkey).toString(config.crypto.encoding),
			encryptionKey	
		)
		const da = await prisma.derived_account.create({
			data: {
				address: _address,
				hd_path: _hdPath,
				base_acc_id: ba.base_acc_id,
				privkey: _privkey,
				privkey_iv: _privkeyIv
			}
		});
		if (!da) {
			throw createError(500, "Failed to create derived account");
		}

		// Success
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
		checkEmailAndThrow(_email); // Check if email has already
		checkUserNameAndThrow(_username);
		checkPasswordAndThrow(_password);

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

export async function deriveAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { password: _password } = req.body;
		if (!_password) {
			throw createError(400, "Missing password");
		}
		const token = jwt.decode(req.cookies.accessToken, {
			json: true,
			complete: true
		});
		const { email: _email, _ } = token.payload as JwtPayload;
		const ba = await prisma.base_account.findFirst({
			where: {
				email: _email
			}
		})
		if (!ba) {
			throw createError(404, 'Base account not found');
		}
		if (!(await isValidPassword(ba.password, _password))) {
			throw createError(401, "Incorrect credentials");
		}

		const mnemonic = "";
		const encryptedMnemonic = ba.mnemonic;

		
		const funcResult = <Array<any>>(await prisma.$queryRaw`SELECT get_largest_derived_acc_id(${ba.base_acc_id}::INT)`);
		const newHDPathIdx = funcResult[0]["get_largest_derived_acc_id"];
		const { address } = await getDerivedAccount(mnemonic, newHDPathIdx);
		
	} catch (err) {
		errorHandler(err, req, res, next);
	}
}