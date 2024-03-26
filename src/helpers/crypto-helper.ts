import { HdPath } from "@cosmjs/crypto";
import config from "../config";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { Slip10RawIndex } from "@cosmjs/crypto";

/**
 * A custom derivation path in the form `m/44'/0'/a'/0/0`
 * with 0-based account index `a`.
 */
export function makeHDPath(a: number): HdPath {
	const args = config.crypto.bip44.defaultHdPath.replaceAll("'", "").split("/");    
	return [
		Slip10RawIndex.hardened(Number(args[1])),
		Slip10RawIndex.hardened(Number(args[2])),
		Slip10RawIndex.hardened(a),
		Slip10RawIndex.normal(Number(args[4])),
		Slip10RawIndex.normal(Number(args[5]))
	];
}

/**
 * 
 * @param {*} mnemonic take a mnemonic to recover the wallet
 * @param {*} acc_idx_derive idex of account to derive
 * @returns {{address:string, pubkey: Uint8Array}}
 */
export async function getDerivedAccount(mnemonic: string, acc_idx_derive: number): Promise<{ address: string, pubKey: string}>{
	const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
		hdPaths: [makeHDPath(acc_idx_derive)],
		prefix: "thasa",
	});

	const [{pubkey, address}] = await wallet.getAccounts();

	return {pubKey: pubkey.toString(), address};
}