import { NextFunction, Request, Response } from "express";
import { ThasaHdWallet } from "../../types/ThasaHdWallet";
import { HdPath, stringToPath, pathToString } from "@cosmjs/crypto";
import { prisma } from "../../connections";
import { errorHandler } from "../../middlewares/errors/error-handler";
import { blackListToken, decodeAndVerifyToken } from "../../helpers/jwt-helper";
import { UserAccountJwtPayload } from "../../types/BaseAccountJwtPayload";
import { genToken } from "../../helpers/jwt-helper";
import { getDerivedAccount, makeHDPath } from "../../helpers/crypto-helper";
import * as credentialHelper from "../../helpers/credentials-helper";
import * as cryptoHelper from "../../helpers/crypto-helper";
import { authConfig, cryptoConfig } from "../../config";
import createHttpError from "http-errors";
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
			throw createHttpError(400, "Missing credentials information");
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
		const wallet = await ThasaHdWallet.generate(cryptoConfig.bip39.mnemonicLength, {
			prefix: cryptoConfig.bech32.prefix,
			hdPaths: [stringToPath(cryptoConfig.bip44.defaultHdPath)]
		});

		const _pbkdf2Salt = Buffer.concat(
			[Buffer.from(`${_email}${_username}`),
			randomBytes(cryptoConfig.pbkdf2.saltLength)]
		);
		const encryptionKey = await cryptoHelper.getEncryptionKey(_password, _pbkdf2Salt);
		const {
			encrypted: _mnemonic,
			iv: _iv
		} = cryptoHelper.encrypt(wallet.mnemonic, encryptionKey);

		// Password-hashing
		_password = await bcrypt.hash(_password, cryptoConfig.bcrypt.saltRounds);

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
			throw createHttpError(500, "Failed to create account");
		}

		// Derive the default (main) wallet account for the user account
		const { address: _address } = (await wallet.getAccounts())[0];
		const walletAccount = await prisma.wallet_accounts.create({
			data: {
				address: _address,
				crypto_hd_path: cryptoConfig.bip44.defaultHdPath,
				nickname: "Account 0",
				wallet_order: 1, // User's first wallet
				is_main_wallet: true,
				user_account_id: userAccount.user_account_id,
			}
		});
		if (!walletAccount) {
			throw createHttpError(500, "Failed to create derived account");
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
			throw createHttpError(400, "Missing credentials information");
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
			throw createHttpError(401, "Invalid login credentials");
		}

		if (!(await cryptoHelper.isValidPassword(_password, userAccount.password))) {
			throw createHttpError(401, "Invalid login credentials");
		}

		// Send access token and refresh token
		const payload = <UserAccountJwtPayload>{
			userAccountId: userAccount.user_account_id
		};
		const accessToken = genToken(payload, authConfig.accessToken.secret, authConfig.accessToken.duration);
		const refreshToken = genToken(payload, authConfig.refreshToken.secret, authConfig.refreshToken.duration);

		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			sameSite: "strict", // Assume that front-end statics will be served on the same host and port as the back-end code, by the back-end code
			secure: true,
			maxAge: 10 * 60 * 1000 // 10 mins in milisecs
		});

		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			sameSite: "strict", // Assume that front-end statics will be served on the same host and port as the back-end code, by the back-end code
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
async function getAccessToken(req: Request, res: Response, next: NextFunction): Promise<void> {
	const { userAccountId: _userAccountId } = <UserAccountJwtPayload>req.body.decodedRefreshTokenPayload;
	const payload = <UserAccountJwtPayload>{
		userAccountId: _userAccountId
	}

	try {
		// Generate a new access token using the payload
		const accessToken = genToken(payload, authConfig.accessToken.secret, authConfig.accessToken.duration);

		// Send the new access token to the client
		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: true,
			sameSite: "none", // Allow cookie to be included in requests from 3rd-party sites
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
	const { userAccountId: _userAccountId } = <UserAccountJwtPayload>req.body.decodedAccessTokenPayload;
	const { password: _password, nickname: _nickname } = req.body;

	const hasPassword: boolean = (_password != null);
	const hasNickname: boolean = (_nickname != null);

	try {
		if (!hasPassword) {
			throw createHttpError(400, "Missing password");
		}
		credentialHelper.checkPasswordAndThrow(_password);

		if (hasNickname) {
			credentialHelper.checkNicknameAndThrow(_nickname);
		}

		const userAccount = await prisma.user_accounts.findUnique({
			where: {
				user_account_id: _userAccountId,
			}
		});

		if (!userAccount) {
			throw createHttpError(404, "Base account not found");
		}

		const isValidPassword: boolean = await cryptoHelper.isValidPassword(_password, userAccount.password);
		if (!isValidPassword) {
			throw createHttpError(401, "Incorrect credentials");
		}

		const encryptionKey: Buffer = await cryptoHelper.getEncryptionKey(_password, userAccount.crypto_pbkdf2_salt);
		const mnemonic: string = cryptoHelper.decrypt(userAccount.crypto_mnemonic, encryptionKey, userAccount.crypto_iv);

		// eslint-disable-next-line
		const result = <Array<any>>(await prisma.$queryRaw`SELECT get_wallet_count_of_user(${userAccount.user_account_id}::INT)`);
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
				user_account_id: _userAccountId
			}
		});

		if (!walletAccount) {
			throw createHttpError(500, "Failed to create account");
		}

		// Success
		res.status(201).json({
			message: "Wallet account created"
		});

	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
	const accessToken: string = req.cookies.accessToken;
	const refreshToken: string = req.cookies.refreshToken;

	try {
		if (accessToken) {
			const secret: string = authConfig.accessToken.secret;
			const accessTokenPayload: UserAccountJwtPayload = decodeAndVerifyToken(accessToken, secret);
			await blackListToken(accessToken, accessTokenPayload);
		}

		const refreshTokenPayload = <UserAccountJwtPayload>req.body.decodedRefreshTokenPayload;
		await blackListToken(refreshToken, refreshTokenPayload)
		res.status(200).json({
			message: "Logout successful"
		})

	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

export { login, register, logout, getAccessToken, createWalletAccount };