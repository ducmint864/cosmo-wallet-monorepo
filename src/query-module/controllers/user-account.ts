import { Request, Response, NextFunction } from "express";
import { prisma } from "../../database/prisma";
import { UserAccountDTO, WalletAccountDTO } from "thasa-wallet-interface";
import { UserAccountJwtPayload } from "../../types/BaseAccountJwtPayload";
import { errorHandler } from "../../middlewares/errors/error-handler";
import createHttpError from "http-errors";
import { pick, mapKeys, camelCase } from "lodash";

async function getMyUserAccountInfo(req: Request, res: Response, next: NextFunction): Promise<any> {
	const {
		includeEmail: _includeEmail,
		includeUsername: _includeUsername,
		includeMainWallet: _includeMainWallet,
	} = req.query;

	const includeEmail: boolean = _includeEmail && (_includeEmail as string).toLowerCase() === "true";
	const includeUsername: boolean = _includeUsername && (_includeUsername as string).toLowerCase() === "true";
	const includeMainWallet: boolean = _includeMainWallet && (_includeMainWallet as string).toLowerCase() === "true";

	const accessToken: UserAccountJwtPayload = req.body.decodedAccessTokenPayload;  // token guaranteed to be valid, decoded by user-auth middleware
	const userAccountID: number = accessToken.userAccountId;

	try {
		const userAccount = await prisma.user_accounts.findUnique({
			where: {
				user_account_id: userAccountID
			},
			select: {
				user_account_id: true,
				email: includeEmail,
				username: includeUsername,
				wallet_accounts: includeMainWallet ? {
					where: {
						is_main_wallet: true
					},
					select: {
						wallet_account_id: true,
						user_account_id: true,
						wallet_order: true,
						nickname: true,
						address: true,
						is_main_wallet: true
					}
				} : false
			}
		})


		if (!userAccount) {
			throw createHttpError(404, "User account not found");
		}

		// Convert prisma response object to instance of UserAccountInfo interface
		const userAccountDTO = <UserAccountDTO>pick(
			mapKeys(userAccount, (_, key) => {
				switch (key) {
					case "wallet_accounts":
						return key;
					default:
						return camelCase(key);
				}
			})
			, ["email", "username", "userAccountId"]
		);

		if (userAccount.wallet_accounts && userAccount.wallet_accounts.length > 0) {
			const walletObj: object = userAccount.wallet_accounts[0];
			userAccountDTO.mainWallet = <WalletAccountDTO>pick(
				mapKeys(walletObj, (_, key) => camelCase(key))
				, ["walletAccountId", "walletOrder", "userAccountId", "address", "nickname", "isMainWallet"]
			)
		}

		// Success
		res.status(200).json(userAccountDTO);

	} catch (err) {
		errorHandler(err, req, res, next);
	}
}	

export { getMyUserAccountInfo };