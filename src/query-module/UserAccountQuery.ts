import { ProtocolError, ProtocolResponse, UserAccountDTO, WalletAccountDTO } from "thasa-wallet-interface";
import { requestHelpers } from "../helpers";
import { join } from "path";
import { walletServerUrl } from "../config";
import { StargateClient, Coin } from "@cosmjs/stargate";
import { WalletAccountQuery } from "./WalletAccountQuery";

const RequestMethod = requestHelpers.RequestMethod;

/**
 * Class for querying user account information
 */
export class UserAccountQuery {
	/**
	 * Base URL for user account queries.
	 */
	public static readonly baseUrl: string = join(walletServerUrl.modules.query.moduleUrl, "/user-account");

	/**
   	 * Retrieves the current user's account information.
   	 *
   	 * @param includeEmail Whether to include the user's email in the response. Defaults to `true`.
   	 * @param includeUsername Whether to include the user's username in the response. Defaults to `true`.
	 * @param includeMainWallet Whether to include the user's main wallet information in the response. Defaults to `true`.
   	 * @returns A `ProtocolResponse` object indicating the query result.
	 * @throws `ProtocolError` object if the query fails.
	 * 
   	 * Example:
	 * ```
   	 * const response = await UserAccountQuery.getMyAccountInfo();
   	 * console.log(response.data); // { email: "user@example.com", username: "username", mainWallet: { ... } }
	 * 
	 * // Retrieve account info without email and username, only main wllet info
	 * const response = await UserAccountQuery.getMyAccountInfo(false, false, true);
  	 * console.log(response.data); // { mainWallet: { ... } }
	 * ```
	 * 
	 * More detailed examples at {@link https://github.com/ducmint864/ths-wallet-adapter}
   	 */
	public static async getMyAccountInfo(
		includeEmail: boolean = true,
		includeUsername: boolean = true,
		includeMainWallet: boolean = true
	): Promise<ProtocolResponse> {
		const url = join(this.baseUrl, "/my-account");

		// Attach query-params to request
		const requestConfig = {
			params: {
				"includeEmail": includeEmail?.toString(),
				"includeUsername": includeUsername?.toString(),
				"includeMainWallet": includeMainWallet?.toString(),
			}
		}

		try {
			// Request user account info from wallet's web server (not including main wallet's balances)
			const protoResponse: ProtocolResponse = await requestHelpers.request(RequestMethod.GET, url, undefined, requestConfig);

			// Check for anomaly in response data
			const userAccount: UserAccountDTO = protoResponse.data;
			if (!userAccount) {
				throw new ProtocolError(
					"Bad response from wallet web server: UserAccountDTO object not available",
					500,
					ProtocolError.ERR_BAD_RESPONSE
				);
			}

			// Get main wallet's balances
			const mainWallet: WalletAccountDTO = userAccount.mainWallet;
			if (mainWallet && includeMainWallet) {
				const balances: readonly Coin[] = await WalletAccountQuery.getBalances(mainWallet.address);
				mainWallet.balances = balances;
			}

			return protoResponse;
		} catch (protoErr: ProtocolError | unknown) {
			throw protoErr;
		}
	}
}
