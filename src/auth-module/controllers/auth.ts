import { NextFunction, Request, Response } from "express";
import { ThasaHdWallet } from "../helpers/types/ThasaHdWallet";
import { HdPath, stringToPath, pathToString } from "@cosmjs/crypto";
import { prisma } from "../../database/prisma";
import { errorHandler } from "../middlewares/errors/error-handler";
import { blackListToken, decodeAndVerifyToken } from "../helpers/jwt-helper";
import { UserAccountJwtPayload } from "../helpers/types/BaseAccountJwtPayload";
import { genToken } from "../helpers/jwt-helper";
import { getDerivedAccount, makeHDPath } from "../helpers/crypto-helper";
import * as credentialHelper from "../helpers/credentials-helper";
import * as cryptoHelper from "../helpers/crypto-helper";
import config from "../config";
import createError from "http-errors";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import "dotenv/config";


async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
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

		const _pbkdf2Salt = Buffer.concat(
			[Buffer.from(`${_email}${_username}`),
			randomBytes(config.crypto.pbkdf2.saltLength)]
		);
		const encryptionKey = await cryptoHelper.getEncryptionKey(_password, _pbkdf2Salt);
		const {
			encrypted: _mnemonic,
			iv: _iv
		} = cryptoHelper.encrypt(wallet.mnemonic, encryptionKey);

		// Password-hashing
		_password = await bcrypt.hash(_password, config.crypto.bcrypt.saltRounds);

		const userAccount = await prisma.user_accounts.create({
			data: {
				email: _email,
				username: _username,
				password: _password,
				crypto_mnemonic: _mnemonic,
				crypto_iv: _iv,
				crypto_pbkdf2_salt: _pbkdf2Salt,
			}
		});

		if (!userAccount) {
			throw createError(500, "Failed to create account");
		}

		// Derive the default (main) wallet account for the user account
		const { address: _address } = (await wallet.getAccounts())[0];
		const walletAccount = await prisma.wallet_accounts.create({
			data: {
				address: _address,
				crypto_hd_path: config.crypto.bip44.defaultHdPath,
				nickname: "Account 0",
				wallet_order: 1, // User's first wallet
				user_acc_id: userAccount.user_acc_id,
			}
		});
		if (!walletAccount) {
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

async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
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

		const userAccount =
			hasEmail
				? await prisma.user_accounts.findUnique({
					where: {
						email: _email
					}
				})
				: await prisma.user_accounts.findUnique({
					where: {
						username: _username
					}
				});

		if (!userAccount) {
			throw createError(401, "Invalid login credentials");
		}

		if (!(await cryptoHelper.isValidPassword(_password, userAccount.password))) {
			throw createError(401, "Invalid login credentials");
		}

		// Send access token and refresh token
		const payload = <UserAccountJwtPayload>{
			userAccountID: userAccount.user_acc_id
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
async function refreshAccessToken(req: Request, res: Response, next: NextFunction): Promise<void> {
	const { userAccountID: _userAccountID } = <UserAccountJwtPayload>req.body.decodedRefreshTokenPayload;
	const payload = <UserAccountJwtPayload>{
		userAccountID: _userAccountID
	}

	try {
		// Generate a new access token using the payload
		const accessToken = genToken(payload, config.auth.accessToken.secret, config.auth.accessToken.duration);

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

async function createWalletAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
	const { userAccountID: _userAccountID } = <UserAccountJwtPayload>req.body.decodedAccessTokenPayload;
	const { password: _password, nickname: _nickname } = req.body;

	const hasPassword: boolean = (_password != null);
	const hasNickname: boolean = (_nickname != null);

	try {
		if (!hasPassword) {
			throw createError(400, "Missing password");
		}
		credentialHelper.checkPasswordAndThrow(_password);

		if (hasNickname) {
			credentialHelper.checkNicknameAndThrow(_nickname);
		}

		const userAccount = await prisma.user_accounts.findUnique({
			where: {
				user_acc_id: _userAccountID
			}
		});

		if (!userAccount) {
			throw createError(404, "Base account not found");
		}

		const isValidPassword: boolean = await cryptoHelper.isValidPassword(_password, userAccount.password);
		if (!isValidPassword) {
			throw createError(401, "Incorrect credentials");
		}

		const encryptionKey: Buffer = await cryptoHelper.getEncryptionKey(_password, userAccount.crypto_pbkdf2_salt);
		const mnemonic: string = cryptoHelper.decrypt(userAccount.crypto_mnemonic, encryptionKey, userAccount.crypto_iv);

		// eslint-disable-next-line
		const result = <Array<any>>(await prisma.$queryRaw`SELECT get_wallet_count_of_user(${userAccount.user_acc_id}::INT)`);
		const newAccIndex: number = result[0]["get_wallet_count_of_user"];
		const newHdPath: HdPath = makeHDPath(newAccIndex);
		const _hdPath: string = pathToString(newHdPath);
		const _walletOrder: number = newAccIndex + 1;
		const { address: _address } = await getDerivedAccount(mnemonic, newHdPath);

		const walletAccount = await prisma.wallet_accounts.create({
			data: {
				address: _address,
				crypto_hd_path: _hdPath,
				nickname: _nickname || `Account ${newAccIndex}`,
				wallet_order: _walletOrder, 
				user_acc_id: _userAccountID
			}
		});

		if (!walletAccount) {
			throw createError(500, "Failed to create account");
		}

		// Success
		res.status(201).json({
			message: "Account created"
		});

	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

async function logOut(req: Request, res: Response, next: NextFunction): Promise<void> {
	const accessToken: string = req.cookies.accessToken;
	const refreshToken: string = req.cookies.refreshToken;

	try {
		if (accessToken) {
			const secret: string = config.auth.accessToken.secret;
			const accessTokenPayload: UserAccountJwtPayload = decodeAndVerifyToken(accessToken, secret);
			await blackListToken(accessToken, accessTokenPayload);
		}

		const refreshTokenPayload = <UserAccountJwtPayload>req.body.decodedRefreshTokenPayload;
		await blackListToken(refreshToken, refreshTokenPayload)
		res.status(200).json({
			message: "Logged out"
		})

	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

export { login, register, logOut, refreshAccessToken, createWalletAccount };