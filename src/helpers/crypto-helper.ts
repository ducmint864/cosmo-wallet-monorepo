import { HdPath } from "@cosmjs/crypto";
import config from "../config";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { Slip10RawIndex } from "@cosmjs/crypto";
import crypto, { pbkdf2, pbkdf2Sync } from 'crypto';
import bcrypt from "bcrypt";

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
export async function getDerivedAccount(mnemonic: string, acc_idx_derive: number): Promise<{ address: string, pubKey: string }> {
	const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
		hdPaths: [makeHDPath(acc_idx_derive)],
		prefix: "thasa",
	});

	const [{ pubkey, address }] = await wallet.getAccounts();

	return { pubKey: pubkey.toString(), address };
}

/**
 * 
 * @param plaintext data in utf-8 format
 * @param encryptionKey encryption key derived with pbkdf2 algo
 * @returns encrypted data and the iv used for encryption
 */
export function encrypt(plaintext: string, encryptionKey: Buffer): { encrypted: string, iv: string } {
	let iv = <string | Buffer>crypto.randomBytes(16); // generate random iv
	const cipher = crypto.createCipheriv(
		config.crypto.aes.algorithm,
		encryptionKey,
		iv
	);
	const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]).toString(config.crypto.encoding);
	iv = iv.toString("base64");
	return { encrypted, iv }
}

/**
 * 
 * @param encrypted encrypted data in the encoding format defined by config.crypto.encoding
 * @param encryptionKey encryption key derived with pbkdf2 algo
 * @param iv the iv used for encryption (encoding format same as *encrypted)
 * @returns decrypted data in utf-8 format
 */
export function decrypt(encrypted: string, encryptionKey: Buffer, iv: string): string {
	const decipher = crypto.createDecipheriv(
		config.crypto.aes.algorithm,
		encryptionKey,
		Buffer.from(iv, config.crypto.encoding)
	)
	const decryptedData = Buffer.concat([decipher.update(encrypted, config.crypto.encoding), decipher.final()]).toString("utf-8");
	return decryptedData;
}

export async function isValidPassword(password: string, passwordHash: string): Promise<boolean> {
	const valid = await bcrypt.compare(password, passwordHash);
	return valid;
}