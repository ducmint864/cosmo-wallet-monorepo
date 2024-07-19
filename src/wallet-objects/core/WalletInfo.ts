import { Coin } from "./Coin";

export interface WalletInfo {
	/**
	 * Bech32-encoded address
	 * Example: "cosmos1s0mxlkjf38qvxzwp46mk4lxjz7v4xh2qjzqzr"
	 */
	address: string,

	/**
	 * Optional public key associated with the wallet
	 * 
	 * Example: "cosmospub1addwnpepqtd28srzf26nw403d2p5zk57h8xjxryrkqtgqzcyqzlsgxkqzr"
	 */
	publicKey?: string,

	/**
	 * Optional BIP Hd path for the wallet
	 * 
	 * Example: "m/44'/118'/0'"
	 */
	cryptoHdPath?: string,

	/**
	 * An array of Coin objects representing the balances of the wallet.
	 * 
	 * Example: [
	 *   { denom: "uatom", amount: "100.00" },
	 *   { denom: "ucosm", amount: "50.00" }
	 * ]
	 */
	balances: Coin[]
}
