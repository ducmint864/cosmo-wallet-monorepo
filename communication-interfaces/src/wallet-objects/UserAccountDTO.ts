import { WalletAccountDTO } from "./WalletAccountDTO";

/**
 * Represents a user account data transfer object.
 */
export interface UserAccountDTO {
	/**
	 * Unique identifier of the user account.
	 */
	userAccountId: string,

	/**
	 * Email address associated with the user account.
	 * @optional
	 */
	email?: string,

	/**
	 * Username chosen by the user.
	 * @optional
	 */
	username?: string,

	/**
	 * Main wallet associated with the user account.
	 * @optional
	 */
	mainWallet?: WalletAccountDTO,
}