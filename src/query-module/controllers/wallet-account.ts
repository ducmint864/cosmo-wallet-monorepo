import { Request, Response, NextFunction } from "express";
import { prisma } from "../../database/prisma";
import { WalletAccountDTO } from "thasa-wallet-interface";
import { UserAccountJwtPayload } from "../../auth-module/helpers/types/BaseAccountJwtPayload";
import { errorHandler } from "../../middlewares/errors/error-handler";
import { pick, mapKeys, camelCase, chain } from "lodash";
import { getBooleanQueryParam, getNumberArrayQueryParam } from "../../helpers/request-parser";
import createHttpError from "http-errors";

async function getMyWalletAccountInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		// Fields that are expected to be in the response's data
		const includeAddress: boolean = getBooleanQueryParam(req, "includeAddress");
		const includeNickname: boolean = getBooleanQueryParam(req, "includeNickname");
		const includeCryptoHdPath: boolean = getBooleanQueryParam(req, "includeCryptoHdPath");
		
		// Filter options ( if none is provided then return all wallets of user)
		const isMainWallet: boolean = getBooleanQueryParam(req, "isMainWallet");
		const walletOrderList: number[] = getNumberArrayQueryParam(req, "walletOrder");
		const getAllWallet: boolean = (!isMainWallet && walletOrderList.length === 0);

		// Get the user's access token and account ID
		const tokenPayload = <UserAccountJwtPayload>req.body.decodedAccessTokenPayload;  // token guaranteed to be valid, decoded by user-auth middleware
		const userAccountID: number = tokenPayload.userAccountId;

		// Query the database for the user's wallet account(s)
		const walletAccountList = await prisma.wallet_accounts.findMany({
			where: getAllWallet
				? { user_account_id: userAccountID }
				: isMainWallet
					? { user_account_id: userAccountID, is_main_wallet: true }
					: { user_account_id: userAccountID, wallet_order: { in: walletOrderList } }
			,
			select: {
				wallet_account_id: true,
				user_account_id: true,
				wallet_order: true,
				is_main_wallet: true,
				address: includeAddress,
				nickname: includeNickname,
				crypto_hd_path: includeCryptoHdPath,
			},
			orderBy: {
				wallet_order: "asc",
			}
		});

		const walletAccountDTOList = <WalletAccountDTO[]>walletAccountList.map(
			(walletAccount) => {
				const transformedObj = mapKeys(walletAccount, (_, key) => camelCase(key));
				return <WalletAccountDTO>pick(
					transformedObj,
					["walletAccountId", "userAccountId", "isMainWallet", "walletOrder", "address", "nickname", "cryptoHdPath"]
				)
			}
		);

		// Success
		res.status(200).json( { wallets: walletAccountDTOList } );

	} catch (err) {
		errorHandler(err, req, res, next);
	}
}


async function findWithAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
	const {
		address: _address,
	} = req.query;

	try {
		if (!_address) {
			throw createHttpError(400, "Please specify wallet address");
		}

		const tokenPayload = <UserAccountJwtPayload>req.body.decodedAccessTokenPayload;  // token guaranteed to be valid, decoded by user-auth middleware
		const userAccountID: number = tokenPayload.userAccountId;

		const walletAccount = await prisma.wallet_accounts.findUnique({
			where: {
				address: _address.toString().toLowerCase(),
			},
			select: {
				address: true,
				wallet_account_id: true,
				user_account_id: true,
				nickname: true,
			}
		})

		// If address not known in db, send back a WalletAccountDTO object with no additional data other than such address
		if (!walletAccount) {
			const walletAccountDTO = <WalletAccountDTO>{
				address: _address
			}
			res.status(200).json(walletAccountDTO);
			return;
		}

		const transformedObj = chain(walletAccount)
			.mapValues((value, key) => {
				if (key === "nickname" || key === "user_account_id") {
					const ownedByUser: boolean = walletAccount.user_account_id === userAccountID;
					if (!ownedByUser) {
						value = undefined; // Set nickname, wallet-account-id to undefined if wallet doesn't belong to user
					}
				}
				return value;
			})
			.mapKeys((_, key) => {
				return camelCase(key);
			})
			.value();

		const walletAccountDTO = <WalletAccountDTO>pick(
			transformedObj,
			["walletAccountId", "userAccountId", "walletOrder", "address", "nickname", "cryptoHdPath"]
		);


		// Success
		res.status(200).json(walletAccountDTO);

	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

export { getMyWalletAccountInfo, findWithAddress };