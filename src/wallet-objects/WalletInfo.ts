export interface WalletInfo {
	/**
	 * Bech32-encoded address
	 */
	address: string;

	/**
	 * Optional public key associated with the wallet
	 */
	publicKey?: string;

	/**
	 * Optional BIP Hd path for the wallet
	 */
	cryptoHdPath?: string;
}
