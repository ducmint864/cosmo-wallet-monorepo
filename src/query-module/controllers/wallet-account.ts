import { Request, Response, NextFunction } from "express";
import { prisma } from "../../database/prisma";
import { WalletAccountDTO } from "thasa-wallet-interface";
import { UserAccountJwtPayload } from "../../auth-module/helpers/types/BaseAccountJwtPayload";
import { errorHandler } from "../../auth-module/middlewares/errors/error-handler";
import { pick, mapKeys, camelCase } from "lodash";
import createHttpError from "http-errors";

// Note -> Get all wallet of the user
async function getMyWalletAccountInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
	const {
		// Fields that are expected to be in the response's data
		includeAddress: _includeAddress,
		includeNickname: _includeNickname,
		includeCryptoHdPath: _includeCryptoHdPath,

		// Options (note: if getMainWallet is "true", option getWalletAtOrder is discarded)
		isMainWallet: _isMainWallet, // value: "true" or "false"
		walletOrder: _walletAtOrder, // value: "1", "2", ...
	} = req.query;

	// Convert request query params from string to bool or number
	try {
		const includeAddress: boolean = _includeAddress && (_includeAddress as string).toLowerCase() === "true";
		const includeNickname: boolean = _includeNickname && (_includeNickname as string).toLowerCase() === "true";
		const includeCryptoHdPath: boolean = _includeCryptoHdPath && (_includeCryptoHdPath as string).toLowerCase() === "true";
		const getMainWallet: boolean = _isMainWallet && (_isMainWallet as string).toLowerCase() === "true";
		const getWalletAtOrder: number = Number(_walletAtOrder);

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

		const walletAccountDTO = <WalletAccountDTO>pick(
			mapKeys(walletAccount, (_, key) => camelCase(key)),
			["walletAccountId", "userAccountId", "isMainWallet", "walletOrder", "address", "nickname", "cryptoHdPath"]
		);

		// Success
		res.status(200).json(walletAccountDTO);

	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

export { getMyWalletAccountInfo };