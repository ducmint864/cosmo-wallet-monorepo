import { WalletAccountInfo } from "./WalletAccountInfo";

export interface UserAccountInfo {
	userAccountId: string,
	email?: string,
	username?: string,
	mainWallet?: WalletAccountInfo,
}
