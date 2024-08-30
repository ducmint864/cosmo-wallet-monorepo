import { NextFunction, Request, Response } from "express";
import { ThasaHdWallet } from "../../types/ThasaHdWallet";
import { HdPath, stringToPath, pathToString } from "@cosmjs/crypto";
import { prisma } from "../../connections";
import { errorHandler } from "../../errors/middlewares/error-handler";
import { invalidateToken, decodeAndVerifyToken, isTokenInvalidated } from "../../general/helpers/jwt-helper";
import { UserAccountJwtPayload } from "../../types/UserAccountJwtPayload";
import { genToken } from "../../general/helpers/jwt-helper";
import { getDerivedAccount, makeHDPath } from "../../general/helpers/crypto-helper";
import { authConfig, cryptoConfig, securityConfig } from "../../config";
import { randomBytes } from "crypto";
import { genCsrfToken } from "../../security/helpers/csrf-helper";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import "dotenv/config";
import * as credentialHelper from "../../general/helpers/credentials-helper";
import * as cryptoHelper from "../../general/helpers/crypto-helper";

/**
 * Registers a new user account.
 *
 * @param {Request} req - The incoming request object.
 * @param {Response} res - The outgoing response object.
 * @param {NextFunction} next - The next middleware function in the stack.
 *
 * @example
 * curl -X POST \
  http://localhost:3000/api/version/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email": "user@example.com", "username": "username", "password": "password"}'
 */
async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {

		let {
			// eslint-disable-next-line
			email: inputEmail,
			username: inputUsername,
			password: inputPassword
		} = req.body;

		const hasEmail: boolean = (inputEmail != null);
		const hasUsername: boolean = (inputUsername != null);
		const hasPassword: boolean = (inputPassword != null);
		const credentialsProvided: boolean = hasEmail && hasPassword;
		// Check if request contains required params

		if (!credentialsProvided) {
			throw createHttpError(400, "Missing credentials information");
		}

		// Validate credentials format
		credentialHelper.checkEmailAndThrow(inputEmail);
		credentialHelper.checkPasswordAndThrow(inputPassword);

		// Generate usrename if not provided
		if (hasUsername) {
			credentialHelper.checkUsernameAndThrow(inputUsername);
		} else {
			inputUsername = await credentialHelper.genUsername();
		}

		// Encrypt mnemonic
		const wallet = await ThasaHdWallet.generate(cryptoConfig.bip39.mnemonicLength, {
			prefix: cryptoConfig.bech32.prefix,
			hdPaths: [stringToPath(cryptoConfig.bip44.defaultHdPath)]
		});

		const argPbkdf2Salt = Buffer.concat(
			[Buffer.from(`${inputEmail}${inputUsername}`),
			randomBytes(cryptoConfig.pbkdf2.saltLength)]
		);
		const encryptionKey = await cryptoHelper.getEncryptionKey(inputPassword, argPbkdf2Salt);
		const {
			encrypted: argMnemonic,
			iv: argIv
		} = cryptoHelper.encrypt(wallet.mnemonic, encryptionKey);

		// Password-hashing
		const hashedPassword: string = await bcrypt.hash(inputPassword, cryptoConfig.bcrypt.saltRounds);

		const userAccount = await prisma.user_accounts.create({
			data: {
				email: inputEmail,
				username: inputUsername,
				password: hashedPassword,
				crypto_mnemonic: argMnemonic,
				crypto_iv: argIv,
				crypto_pbkdf2_salt: argPbkdf2Salt,
			}
		});

		if (!userAccount) {
			throw createHttpError(500, "Failed to create account");
		}

		// Derive the default (main) wallet account for the user account
		const { address: argAddress } = (await wallet.getAccounts())[0];
		const walletAccount = await prisma.wallet_accounts.create({
			data: {
				address: argAddress,
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

/**
 * Logs in an existing user account.
 *
 * @param {Request} req - The incoming request object.
 * @param {Response} res - The outgoing response object.
 * @param {NextFunction} next - The next middleware function in the stack.
 *
 * @example
 * curl -X POST \
  http://localhost:3000/api/version/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "user@example.com", "password": "password"}'
 */
async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const {
			email: inputEmail,
			username: inputUsername,
			password: inputPassword
		} = req.body;

		const hasEmail: boolean = (inputEmail != null);
		const hasUsername: boolean = (inputUsername != null);
		const hasPassword: boolean = (inputPassword != null);
		const credentialsProvided: boolean = (hasEmail || hasUsername) && hasPassword

		if (!credentialsProvided) {
			throw createHttpError(400, "Missing credentials information");
		}

		// Validate credentials format
		if (hasEmail) {
			credentialHelper.checkEmailAndThrow(inputEmail);
		} else if (hasUsername) {
			credentialHelper.checkUsernameAndThrow(inputUsername);
		}
		credentialHelper.checkPasswordAndThrow(inputPassword);

		const userAccount = await prisma.user_accounts.findUnique({
			where: hasEmail ? { email: inputEmail } : { username: inputUsername }
		})

		if (!userAccount) {
			throw createHttpError(401, "Invalid login credentials");
		}

		const isValidPass: boolean = await credentialHelper.isValidPassword(inputPassword, userAccount.password);
		if (!isValidPass) {
			throw createHttpError(401, "Invalid login credentials");
		}

		// Invalidate client's old tokens if they have any (do it in silence)
		try {
			await _invalidateCurrentTokens(req, res);
		} catch (_) { };

		// Send access token and refresh token
		const payload: UserAccountJwtPayload = {
			userAccountId: userAccount.user_account_id,
			userRole: userAccount.role,
		};
		const accessToken: string = genToken(
			payload,
			authConfig.token.accessToken.privateKey,
			authConfig.token.accessToken.durationStr,
			authConfig.token.accessToken.signingAlgo,
		);
		const refreshToken: string = genToken(
			payload,
			authConfig.token.refreshToken.privateKey,
			authConfig.token.refreshToken.durationStr,
			authConfig.token.refreshToken.signingAlgo,
		);

		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			sameSite: "strict", // Assume that front-end statics will be served on the same host and port as the back-end code, by the back-end code
			secure: true,
			maxAge: authConfig.token.accessToken.durationMinutes * 60 * 1000 // convert inutes to milisecs
		});

		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			sameSite: "strict", // Assume that front-end statics will be served on the same host and port as the back-end code, by the back-end code
			secure: true,
			maxAge: authConfig.token.refreshToken.durationMinutes * 60 * 1000 //  Convert minutes to milisecs
		});

		// Send csrf-token
		const csrfToken: string = genCsrfToken(payload);
		res.cookie("csrfToken", csrfToken, {
			httpOnly: false,
			sameSite: "strict",
			secure: true,
			maxAge: securityConfig.csrf.csrfToken.durationMinutes * 60 * 1000 // Convert minutes to milisecs
		})

		res.status(200).json({
			message: "Login sucessful"
		});
	} catch (err) {
		errorHandler(err, req, res, next);
	}
}


/**
 * Refreshes an existing access token.
 *
 * @param {Request} req - The incoming request object.
 * @param {Response} res - The outgoing response object.
 * @param {NextFunction} next - The next middleware function in the stack.
 *
 * @example
 * curl -X POST \
  http://localhost:3000/api/version/auth/refresh-session \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken": "refresh-token-value"}'
 */
async function refreshSession(req: Request, res: Response, next: NextFunction): Promise<void> {
	// Refusal of service when access token is present and still viable
	const accessToken: string = req.cookies["accessToken"];
	const accessTokenPayload: UserAccountJwtPayload = decodeAndVerifyToken(accessToken, authConfig.token.accessToken.publicKey);
	if (accessTokenPayload !== null) {
		res.status(409).json({
			message: "Access token is still viable, no new token issued",
		});
		return;
	}

	// decodedRefreshTokenPayload property is injected into request body by the 'requireRefreshToken' middleware
	const refreshTokenPayload: UserAccountJwtPayload = req.body["decodedRefreshTokenPayload"];
	const newTokenPayload: UserAccountJwtPayload = {
		userAccountId: refreshTokenPayload.userAccountId,
		userRole: refreshTokenPayload.userRole,
	};

	try {
		// Generate a new access token using the payload
		const accessToken: string = genToken(
			newTokenPayload,
			authConfig.token.accessToken.privateKey,
			authConfig.token.accessToken.durationStr
		);

		// Send the new access token to the client
		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: true,
			sameSite: "none", // Allow cookie to be included in requests from 3rd-party sites
			maxAge: authConfig.token.accessToken.durationMinutes * 60 * 1000 // Convert minutes to  milliseconds
		});

		// Generate new csrf-token
		const csrfToken: string = genCsrfToken(newTokenPayload);

		// Send the new csrf-token to client
		res.cookie("csrfToken", csrfToken, {
			httpOnly: false,
			secure: true,
			sameSite: "strict",
			maxAge: securityConfig.csrf.csrfToken.durationMinutes * 60 * 1000 // Convert minutes to miliseconds
		})

		res.status(200).json({
			message: "Access-token, csrf-token issued"
		});

	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

/**
 * Creates a new wallet account for an existing user.
 *
 * @param {Request} req - The incoming request object.
 * @param {Response} res - The outgoing response object.
 * @param {NextFunction} next - The next middleware function in the stack.
 *
 * @example
 * curl -X POST \
  http://localhost:3000/api/version/auth/create-wallet-account \
  -H 'Content-Type: application/json' \
  -d '{"password": "password", "nickname": "crypto-chad"}'
 */
async function createWalletAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
	const { password: inputPassword, nickname: inputUsername } = req.body;
	const accessTokenPayload: UserAccountJwtPayload = req.body["decodedAccessTokenPayload"];
	const argUserAccountId: number = accessTokenPayload.userAccountId;

	const hasPassword: boolean = (inputPassword != null);
	const hasNickname: boolean = (inputUsername != null);

	try {
		if (!hasPassword) {
			throw createHttpError(400, "Missing password");
		}
		credentialHelper.checkPasswordAndThrow(inputPassword);

		if (hasNickname) {
			credentialHelper.checkNicknameAndThrow(inputUsername);
		}

		const userAccount = await prisma.user_accounts.findUnique({
			where: {
				user_account_id: argUserAccountId,
			}
		});

		if (!userAccount) {
			throw createHttpError(404, "Base account not found");
		}

		const isValidPassword: boolean = await credentialHelper.isValidPassword(inputPassword, userAccount.password);
		if (!isValidPassword) {
			throw createHttpError(401, "Incorrect credentials");
		}

		const encryptionKey: Buffer = await cryptoHelper.getEncryptionKey(inputPassword, userAccount.crypto_pbkdf2_salt);
		const mnemonic: string = cryptoHelper.decrypt(userAccount.crypto_mnemonic, encryptionKey, userAccount.crypto_iv);

		// eslint-disable-next-line
		const sqlResult: any[] = await prisma.$queryRaw`SELECT get_wallet_count_of_user(${userAccount.user_account_id}::INT)`;
		const newAccIndex: number = sqlResult[0]["get_wallet_count_of_user"];
		const newHdPath: HdPath = makeHDPath(newAccIndex);
		const argHdPath: string = pathToString(newHdPath);
		const argWalletOrder: number = newAccIndex + 1;
		const { address: argAddress } = await getDerivedAccount(mnemonic, newHdPath);

		const walletAccount = await prisma.wallet_accounts.create({
			data: {
				address: argAddress,
				crypto_hd_path: argHdPath,
				nickname: inputUsername || `Account ${newAccIndex}`,
				wallet_order: argWalletOrder,
				user_account_id: argUserAccountId,
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

/**
 * Logs out an existing user account.
 *
 * @param {Request} req - The incoming request object.
 * @param {Response} res - The outgoing response object.
 * @param {NextFunction} next - The next middleware function in the stack.
 *
 * @example
 * curl -X POST \
  http://localhost:3000/api/version/auth/logout
 */
async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
	/** This middelware comes after requireAccessToken(...)
	 * -> Guarateeed availability of decoded access-token payload
	 *    Meanwhile, access to refresh-token is not guaranteed
	 * */
	let invalidationError: Error;
	try {
		console.log(req.cookies["accessToken"]);
		console.log(req.cookies["refreshToken"]);
		await _invalidateCurrentTokens(req, res);
	} catch (err) {
		invalidationError = err;
	}

	try {
		if (invalidationError) {
			throw createHttpError(
				500,
				`logout(): cannot invalidate tokens\n${invalidationError}`,
				invalidationError
			)
		}

		res.status(200).json({
			message: "Logout successful"
		})
	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

/**
 * Private utility function to clear all of the user's tokens.
 *
 * @param {Request} req - The incoming request object.
 * @param {Response} res - The outgoing response object.
 *
 * @example
 * // This function is not intended to be called directly by clients.
 */
async function _invalidateCurrentTokens(req: Request, res: Response): Promise<void> {
	const accessToken: string = req.cookies["accessToken"];
	const refreshToken: string = req.cookies["refreshToken"];

	// Invalidate access-token (if available)
	if (accessToken) {
		let accessTokenPayload: UserAccountJwtPayload;
		accessTokenPayload =
			req.body["decodedAccessTokenPayload"] ??
			decodeAndVerifyToken(accessToken, authConfig.token.accessToken.publicKey);
		await invalidateToken(accessToken, accessTokenPayload);
	}

	// Invalidate refresh token (if available)
	if (refreshToken) {
		let refreshTokenPayload: UserAccountJwtPayload;
		refreshTokenPayload =
			req.body["decodedRefreshTokenPayload"] ??
			decodeAndVerifyToken(refreshToken, authConfig.token.refreshToken.publicKey);
		await invalidateToken(refreshToken, refreshTokenPayload)
	}

	// Instruct clients to remove obsolete token cookies
	res.clearCookie("accessToken"); // Add domain options later
	res.clearCookie("refreshToken");
	res.clearCookie("csrfToken");
}


export {
	login,
	register,
	logout,
	refreshSession,
	createWalletAccount,
};