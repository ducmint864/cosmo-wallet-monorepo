import { ProtocolError, ProtocolResponse, WalletAccountDTO, WalletInfo } from "thasa-wallet-interface";
import { requestHelpers } from "../helpers";
import { bech32 } from "bech32";
import { join } from "path";
import { walletServerUrl } from "../config";
import { Coin } from "thasa-wallet-interface";
import { StargateClient } from "@cosmjs/stargate";

const RequestMethod = requestHelpers.RequestMethod;

export class WalletAccountQuery {
	/**
	 * Base URL for user account queries.
	 */
	public static readonly baseUrl = join(walletServerUrl.modules.query.moduleUrl, "/wallet-account");

	/**
	 * Validates a Bech32-encoded address`
	 * @param address The Bech32 address to validate.
	 * @returns `true` if the address is valid, `false` otherwise.
	 */
	protected static isValidBech32Address(address: string): boolean {
		const decoded = bech32.decode(address)
		if (!decoded) {
			return false;
		}
		return true;
	}

	/**
	 * Retrieves information about the current user's wallets.
	 * @param includeAddress Whether to include the wallet address in the response. Defaults to `true`.
	 * @param includeNickname Whether to include the wallet nickname in the response. Defaults to `true`.
	 * @param includeCryptoHdPath Whether to include the wallet's crypto HD path in the response. Defaults to `true`.
	 * @param includeBalances Whether to include the wallets' balances in the response. Defaults to `true`.
	 * @param isMainWallet Whether to only return the main wallet. Defaults to `false`.
	 * @param walletOrder An array of wallet orders to filter by. Only applicable if `isMainWallet` is `false`.
	 * @notice If both isMainWallet and walletOrder args are falsy/negative, return all wallets of the user
	 * @returns A `ProtocolResponseObject` indicating the query results
	 * @throws A `ProtocolError` object if the query fails
	 * 
	 * Example:
	 * ```typescript
	 * // Get all wallets of user:
	 * const response = await WalletAccountQuery.getMyWalletInfo();
	 * console.log(response.data.wallets); // Output: 
	 * 	    wallets: [ 
	 * 		    { address: "thasa1...", nickname: "My Wallet 1", ... },
	 *  	    { address: "thasa2...", nickname: "My Wallet 2", ... }
	 * 	    ]
	 * ```
	 * 
	 * More detailed examples at {@link https://github.com/ducmint864/ths-wallet-adapter}
	 */
	public static async getMyWalletInfo(
		includeAddress: boolean = true,
		includeNickname: boolean = true,
		includeCryptoHdPath: boolean = true,
		includeBalances: boolean = true,
		isMainWallet: boolean = false,
		...walletOrder: number[] // This arg will be discarded if isMainWallet arg is true
	): Promise<ProtocolResponse> {
		const url: string = join(this.baseUrl, "/my-wallet");

		// Arrange query params
		const requestConfig = {
			params: {
				"includeAddress": includeAddress?.toString(),
				"includeNickname": includeNickname?.toString(),
				"includeCryptoHdPath": includeCryptoHdPath?.toString(),
				"isMainWallet": isMainWallet?.toString(),
				"walletOrder": walletOrder?.toString(),
			}
		}

		try {
			// Make request to wallet's web server
			const protoResponse: ProtocolResponse = await requestHelpers.request(
				RequestMethod.GET,
				url,
				undefined,
				requestConfig
			);

			// Check for anomaly in response data
			const wallets: WalletAccountDTO[] = protoResponse.data.wallets;
			if (!wallets) {
				throw new ProtocolError("Bad response data from wallet server", 500, ProtocolError.ERR_BAD_RESPONSE);
			}

			// Get wallets' balances
			if (includeBalances) {
				const balancesPromises: Promise<readonly Coin[]>[] = wallets.map(
					(wallet: WalletAccountDTO) => this._getBalances(wallet)
				);

				const balancesArray: (readonly Coin[])[] = await Promise.all(balancesPromises);

				// Use forEach for side effects
				balancesArray.forEach((balances: readonly Coin[], index: number) => {
					if (wallets[index]) {
						wallets[index].balances = balances;
					}
				});
			}

			return protoResponse;
		} catch (protoErr: ProtocolError | unknown) {
			throw protoErr;
		}
	}

	/**
	 * Finds a wallet by its address.
	 * @param address The Bech32 address of the wallet to find.
	 * @param includeBalances Whether to include the wallet's balances in the response. Defaults to `true`.
	 * @returns A `ProtocolResponse` object indicating the query results
	 * @throws A `ProtocolError` if the address isn't valid or the query fails
	 * @notice The `data` object inside the returned `ProtocolResponse` object:
	 * ```JSON
	 * {
	 * 	address: "thasa1akb2...",
	 * 	nickname: "Crypto Ant", // Only available if user owns this wallet.
	 * 	walletAccountId: 19, // Only available if user had created wallet via Thasa Wallet app
	 * 	userAccountId: 1 // Only available if user had created wallet via Thasa Wallet app
	 * }
	 * ``` 
	 * Example:
	 * ```
	 * const response = await WalletAccountQuery.findWallet("thasa1...");
	 * console.log(response.data); // Output: { address: "thasa1...", nickname: "My Wallet", balances: [ ... ], ... }
	 * ```
	 * 
	 * More detailed examples at {@link https://github.com/ducmint864/ths-wallet-adapter}
	 */
	public static async getWalletInfo(
		address: string,
		includeBalances: boolean = true,
	): Promise<ProtocolResponse> {
		// Verify address
		if (!this.isValidBech32Address(address)) {
			throw new ProtocolError("Invalid Bech32 address", 400, ProtocolError.ERR_BAD_REQUEST);
		}

		// Request web server for basic wallet info except wallet balances
		const url: string = join(this.baseUrl, "/find");
		const requestConfig = {
			params: {
				"address": address,
			}
		}
		try {
			const protoResponse: ProtocolResponse = await requestHelpers.request(
				RequestMethod.GET,
				url,
				undefined,
				requestConfig
			);

			// Check for anomaly in response data
			const wallet: WalletAccountDTO = protoResponse.data;
			if (!wallet) {
				throw new ProtocolError("Bad response data from wallet server", 500, ProtocolError.ERR_BAD_RESPONSE);
			}

			// Get wallet's balances
			if (includeBalances) {
				const balances: readonly Coin[] = await this._getBalances(wallet);
				protoResponse.data.balances = balances;
			}

			return protoResponse;

		} catch (protoErr: ProtocolError | unknown) {
			throw protoErr;
		}
	}

	/**
	 * Retrieves the balances for a given wallet.
	 * 
	 * @param {string} address - The address of the wallet to retrieve balances for.
	 * @param {...string[]} denoms - Optional denominations to filter balances by.
	 * @returns {Promise<readonly Coin[]>} A promise resolving to an array of Coin objects representing the wallet's balances.
	 * 
	 * Example:
	 * ```typescript
	 * const balances: readonly Coin[] = await WalletAccountQuery.getBalances("thasa1...", "uluna");
	 * console.log(balances); // Output: [ { amount: "100000000", denom: "uluna" } ]
	 * ```
	 */
	public static async getBalances(
		address: string,
		...denoms: string[]
	): Promise<readonly Coin[]> {
		const wallet: WalletAccountDTO = { address };
		const balances: readonly Coin[] = await this._getBalances(wallet, ...denoms);
		return balances;
	}


	/**
	 * Retrieves the balances for a given wallet.
	 * 
	 * @param {WalletInfo} wallet - The wallet to retrieve balances for.
	 * @param {...string[]} denoms - Optional denominations to filter balances by.
	 * @returns {Promise<readonly Coin[]>} A promise resolving to an array of Coin objects representing the wallet's balances.
	 */
	private static async _getBalances(
		wallet: WalletInfo,
		...denoms: string[]
	): Promise<readonly Coin[]> {
		const url = "http://localhost:26657"; // Dev
		const client: StargateClient = await StargateClient.connect(url);
		if (denoms.length > 0) {
			const promises: Promise<Coin>[] = denoms.map((denom) => client.getBalance(wallet.address, denom));
			const balances: readonly Coin[] = await Promise.all(promises);
			return balances;
		} else {
			const balances: readonly Coin[] = await client.getAllBalances(wallet.address);
			return balances;
		}
	}

}