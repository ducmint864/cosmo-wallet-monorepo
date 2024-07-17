import { Request, Response, NextFunction } from "express";
import { prisma } from "../../database/prisma";
import { WalletAccountInfo } from "thasa-wallet-interface";
import { UserAccountJwtPayload } from "../../auth-module/helpers/types/BaseAccountJwtPayload";
import { errorHandler } from "../../auth-module/middlewares/errors/error-handler";
import { pick, mapKeys, camelCase, values } from "lodash";
import createHttpError from "http-errors";

async function getWalletAccountInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
	const {
		// Fields that are expected to be in the response's data
		includeAddress: _includeAddress,
		includeNickname: _includeNickname,
		includeCryptoHdPath: _includeCryptoHdPath,

		// Options (note: if getMainWallet is "true", option getWalletAtOrder is discarded)
		getMainWallet: _getMainWallet, // value: "true" or "false"
		getWalletAtOrder: _getWalletAtOrder, // value: "1", "2", ...
	} = req.query;

	// Convert request query params from string to bool, number
	try {
		const includeAddress: boolean = _includeAddress && (_includeAddress as string).toLowerCase() === "true";
		const includeNickname: boolean = _includeNickname && (_includeNickname as string).toLowerCase() === "true";
		const includeCryptoHdPath: boolean = _includeCryptoHdPath && (_includeCryptoHdPath as string).toLowerCase() === "true";
		const getMainWallet: boolean = _getMainWallet && (_getMainWallet as string).toLowerCase() === "true";
		const getWalletAtOrder: number = Number(_getWalletAtOrder);

		if (!getMainWallet && isNaN(getWalletAtOrder)) {
			throw createHttpError(400, "Option getWalletAtOrder must be a valid number");
		}

		const accessToken = <UserAccountJwtPayload>req.body.decodedAccessTokenPayload;  // token guaranteed to be valid, decoded by user-auth middleware
		const userAccountID: number = accessToken.userAccountId;

		const walletAccount = await prisma.wallet_accounts.findFirst({
			where: getMainWallet ? {
				user_account_id: userAccountID,
				is_main_wallet: true,
			} : {
				user_account_id: userAccountID,
				wallet_order: getWalletAtOrder,
			},
			select: {
				wallet_account_id: true,
				user_account_id: true,
				wallet_order: true,
				is_main_wallet: true,
				address: includeAddress,
				nickname: includeNickname,
				crypto_hd_path: includeCryptoHdPath,
			}
		});

		const walletAccountInfo = <WalletAccountInfo>pick(
			mapKeys(walletAccount, (_, key) => camelCase(key)),
			[ "walletAccountId", "userAccountId", "isMainWallet", "walletOrder", "address", "nickname", "cryptoHdPath" ]
		);

		// Success
		res.status(200).json(walletAccountInfo);

	} catch (err) {
		errorHandler(err, req, res, next);
	}
}	

export { getWalletAccountInfo };