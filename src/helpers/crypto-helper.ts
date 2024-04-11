import { HdPath } from "@cosmjs/crypto";
import config from "../config";
//import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { ThasaHdWallet } from "./ThasaHdWallet";
import { Slip10RawIndex } from "@cosmjs/crypto";
<<<<<<< HEAD
import crypto, { pbkdf2, pbkdf2Sync } from 'crypto';
=======
import crypto from 'crypto';
import bcrypt from "bcrypt";
>>>>>>> ducminh-test

/**
 * A custom derivation path in the form `m/44'/0'/a'/0/0`
 * with 0-based account index `a`.
 * @param accIndex 0-based account index
 * @returns HD path
 */
<<<<<<< HEAD
export function makeHDPath(a: number): HdPath {
=======
export function makeHDPath(accIndex: number): HdPath {
>>>>>>> ducminh-test
	const args = config.crypto.bip44.defaultHdPath.replaceAll("'", "").split("/");
	return [
		Slip10RawIndex.hardened(Number(args[1])),
		Slip10RawIndex.hardened(Number(args[2])),
		Slip10RawIndex.hardened(accIndex),
		Slip10RawIndex.normal(Number(args[4])),
		Slip10RawIndex.normal(Number(args[5]))
	];
}

/**
 * 
 * @param {*} mnemonic take a mnemonic to recover the wallet
 * @param {*} hdPath idex of account to derive
 * @returns {{address:string, pubkey: Uint8Array}}
 */
<<<<<<< HEAD
export async function getDerivedAccount(mnemonic: string, acc_idx_derive: number): Promise<{ address: string, pubKey: string }> {
	const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
		hdPaths: [makeHDPath(acc_idx_derive)],
		prefix: "thasa",
	});

	const [{ pubkey, address }] = await wallet.getAccounts();

	return { pubKey: pubkey.toString(), address };
=======
export async function getDerivedAccount(mnemonic: string, hdPath: HdPath): Promise<{ pubKey: string, privkey: string,  address: string }> {
	const wallet = await ThasaHdWallet.fromMnemonic(mnemonic, {
		hdPaths: [hdPath],
		prefix: "thasa",
	});

	const [{ pubkey, privkey, address }] = await wallet.getAccountsWithPrivkeys();

	return { pubKey: pubkey.toString(), privkey: privkey.toString(), address };
>>>>>>> ducminh-test
}

/**
 * 
 * @param plaintext data in utf-8 format
 * @param encryptionKey encryption key derived with pbkdf2 algo
 * @returns encrypted data and the iv used for encryption
 */
<<<<<<< HEAD
export function encrypt(plaintext: string, encryptionKey: Buffer): { encrypted: string, iv: string } {
	let iv = <string | Buffer>crypto.randomBytes(16); // generate random iv
=======
export function encrypt(plaintext: string, encryptionKey: Buffer): { encrypted: Buffer, iv: Buffer } {
	let iv = crypto.randomBytes(config.crypto.aes.ivLength); // generate random iv
>>>>>>> ducminh-test
	const cipher = crypto.createCipheriv(
		config.crypto.aes.algorithm,
		encryptionKey,
		iv
	);
<<<<<<< HEAD
	const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]).toString(config.crypto.encoding);
	iv = iv.toString("base64");
=======
	const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
>>>>>>> ducminh-test
	return { encrypted, iv }
}

/**
 * 
 * @param encrypted encrypted data in the encoding format defined by config.crypto.encoding
 * @param encryptionKey encryption key derived with pbkdf2 algo
 * @param iv the iv used for encryption (encoding format same as *encrypted)
 * @returns decrypted data in utf-8 format
 */
<<<<<<< HEAD
export function decrypt(encrypted: string, encryptionKey: Buffer, iv: string): string {
	const decipher = crypto.createDecipheriv(
		config.crypto.aes.algorithm,
		encryptionKey,
		Buffer.from(iv, config.crypto.encoding)
	)
	const decryptedData = Buffer.concat([decipher.update(encrypted, config.crypto.encoding), decipher.final()]).toString("utf-8");
	return decryptedData;
}
=======
export function decrypt(encrypted: Buffer, encryptionKey: Buffer, iv: Buffer): string {
	const decipher = crypto.createDecipheriv(
		config.crypto.aes.algorithm,
		encryptionKey,
		iv
	)
	const decryptedData = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf-8");
	return decryptedData;
}

export async function isValidPassword(password: string, passwordHash: string): Promise<boolean> {
	const valid = await bcrypt.compare(password, passwordHash);
	return valid;
}


export async function getEncryptionKey(password: string, pbkdf2Salt: Buffer): Promise<Buffer> {
	const encryptionKey = await new Promise<Buffer>((resolve, reject) => crypto.pbkdf2(
		password,
		pbkdf2Salt,
		config.crypto.pbkdf2.iterations,
		config.crypto.pbkdf2.keyLength,
		config.crypto.pbkdf2.algorithm,
		(err, key) => {
			if (err) {
				reject(err);
			}
			resolve(key);
		}
	));
	return encryptionKey;
}
>>>>>>> ducminh-test
