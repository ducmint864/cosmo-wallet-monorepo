export interface WalletAccountInfo {
	walletAccountId: string,
	userAccountId: string,
	walletOrder?: number,
	address?: string,
	nickname?: string,
	cryptoHdPath?: string,
	isMainWallet: boolean,
}
