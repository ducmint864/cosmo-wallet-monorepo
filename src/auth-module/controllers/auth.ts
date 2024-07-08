import { NextFunction, Request, Response } from "express";
import { ThasaHdWallet } from "../helpers/types/ThasaHdWallet";
import { stringToPath, pathToString } from "@cosmjs/crypto";
import { prisma } from "../../database/prisma";
import { errorHandler } from "../middlewares/errors/error-handler";
import { blackListToken, decodeAndVerifyToken } from "../helpers/jwt-helper";
import { BaseAccountJwtPayload } from "../helpers/types/BaseAccountJwtPayload";
import { genToken } from "../helpers/jwt-helper";
import { getDerivedAccount, makeHDPath } from "../helpers/crypto-helper";
import * as credentialHelper from "../helpers/credentials-helper";
import * as cryptoHelper from "../helpers/crypto-helper";
import config from "../config";
import createError from "http-errors";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import "dotenv/config";


export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {

		let {
			// eslint-disable-next-line
			email: _email,
			username: _username,
			password: _password
		} = req.body;

		const hasEmail: boolean = (_email != null);
		const hasUsername: boolean = (_username != null);
		const hasPassword: boolean = (_password != null);

		// Check if request contains required params
		if (!(hasEmail && hasPassword)) {
			throw createError(400, "Missing credentials information");
		}

		// Validate credentials format
		credentialHelper.checkEmailAndThrow(_email);
		credentialHelper.checkPasswordAndThrow(_password);

		// Generate usrename if not provided
		if (hasUsername) {
			credentialHelper.checkUsernameAndThrow(_username);
		} else {
			_username = await credentialHelper.genUsername();
		}

		// Encrypt mnemonic
		const wallet = await ThasaHdWallet.generate(config.crypto.bip39.mnemonicLength, {
			prefix: config.crypto.bech32.prefix,
			hdPaths: [stringToPath(config.crypto.bip44.defaultHdPath)]
		});

		const _pbkdf2Salt = Buffer.concat([Buffer.from(`${_email}${_username}`), randomBytes(config.crypto.pbkdf2.saltLength)]);
		const encryptionKey = await cryptoHelper.getEncryptionKey(_password, _pbkdf2Salt);
		const {
			encrypted: _mnemonic,
			iv: _iv
		} = cryptoHelper.encrypt(wallet.mnemonic, encryptionKey);

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
		const { address: _address } = (await wallet.getAccounts())[0];
		const da = await prisma.derived_account.create({
			data: {
				address: _address,
				hd_path: config.crypto.bip44.defaultHdPath,
				nickname: "Account 0",
				base_acc_id: ba.base_acc_id
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
		const {
			email: _email,
			username: _username,
			password: _password
		} = req.body;

		const hasEmail: boolean = (_email != null);
		const hasUsername: boolean = (_username != null);
		const hasPassword: boolean = (_password != null);

		if (!(hasEmail || hasUsername) && hasPassword) {
			throw createError(400, "Missing credentials information");
		}

		// Validate credentials format
		if (hasEmail) {
			credentialHelper.checkEmailAndThrow(_email);
		} else if (hasUsername) {
			credentialHelper.checkUsernameAndThrow(_username);
		}
		credentialHelper.checkPasswordAndThrow(_password);

		const ba =
			hasEmail
				? await prisma.base_account.findUnique({
					where: {
						email: _email
					}
				})
				: await prisma.base_account.findUnique({
					where: {
						username: _username
					}
				});

		if (!ba) {
			throw createError(401, "Invalid login credentials");
		}

		if (!(await cryptoHelper.isValidPassword(_password, ba.password))) {
			throw createError(401, "Invalid login credentials");
		}

		// Send access token and refresh token
		const payload = <BaseAccountJwtPayload>{
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
	const { email: _email, username: _username } = <BaseAccountJwtPayload>req.body.decodedRefreshTokenPayload;
	const newPayload = {
		email: _email,
		username: _username,
	}

	try {
		// Generate a new access token using the payload
		const accessToken = genToken(newPayload, config.auth.accessToken.secret, config.auth.accessToken.duration);

		// Send the new access token to the client
		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: true,
			maxAge: 10 * 60 * 1000 // 10 mins in milliseconds
		});

		res.status(200).json({
			message: "Access token granted"
		});
	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

export async function deriveAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
	const { email: _email } = <BaseAccountJwtPayload>req.body.decodedAccessTokenPayload;
	const {
		password,
		nickname: _nickname,
	} = req.body;

	const hasPassword: boolean = (password != null);
	const hasNickname: boolean = (_nickname != null);

	try {
		credentialHelper.checkEmailAndThrow(_email);

		if (!hasPassword) {
			throw createError(400, "Missing password");
		}
		credentialHelper.checkPasswordAndThrow(password);

		if (hasNickname) {
			credentialHelper.checkNicknameAndThrow(_nickname);
		}

		const ba = await prisma.base_account.findUnique({
			where: {
				email: _email
			}
		});

		if (!ba) {
			throw createError(404, "Base account not found");
		}

		if (!(await cryptoHelper.isValidPassword(password, ba.password))) {
			throw createError(401, "Incorrect credentials");
		}

		const encryptionKey = await cryptoHelper.getEncryptionKey(password, ba.pbkdf2_salt);
		const mnemonic = cryptoHelper.decrypt(ba.mnemonic, encryptionKey, ba.iv);
		// eslint-disable-next-line
		const result = <Array<any>>(await prisma.$queryRaw`SELECT get_number_of_derived_account(${ba.base_acc_id}::INT)`);
		const newAccIndex = result[0]["get_number_of_derived_account"];
		const newHdPath = makeHDPath(newAccIndex);
		const _hdPath = pathToString(newHdPath);
		const { address: _address } = await getDerivedAccount(mnemonic, newHdPath);

		const da = await prisma.derived_account.create({
			data:
				_nickname ? {
					address: _address,
					hd_path: _hdPath,
					nickname: _nickname,
					base_acc_id: ba.base_acc_id
				} : {
					address: _address,
					hd_path: _hdPath,
					nickname: `Account ${newAccIndex}`,
					base_acc_id: ba.base_acc_id
				}
		});
		if (!da) {
			throw createError(500, "Failed to create account");
		}

		res.status(201).json({
			message: "Account created"
		});
	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

export async function logOut(req: Request, res: Response, next: NextFunction): Promise<void> {
	const accessToken: string = req.cookies.accessToken;
	const refreshToken: string = req.cookies.refreshToken;

	try {
		if (accessToken) {
			const secret: string = config.auth.accessToken.secret;
			const accessTokenPayload: BaseAccountJwtPayload = decodeAndVerifyToken(accessToken, secret);
			await blackListToken(accessToken, accessTokenPayload);
		}

		const refreshTokenPayload = <BaseAccountJwtPayload>req.body.decodedRefreshTokenPayload;
		await blackListToken(refreshToken, refreshTokenPayload)
		res.status(200).json({
			message: "Logged out"
		})
	} catch (err) {
		// console.log(err);
		errorHandler(err, req, res, next);
	}
}