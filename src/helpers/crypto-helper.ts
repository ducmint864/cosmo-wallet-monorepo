import { HdPath } from "@cosmjs/crypto";
import { cryptoConfig } from "../config";
import { ThasaHdWallet } from "../types/ThasaHdWallet";
import { Slip10RawIndex } from "@cosmjs/crypto";
import { pathToString as hdPathToString, stringToPath as stringToHdPath } from "@cosmjs/crypto";
import crypto from "crypto";
import bcrypt from "bcrypt";

/**
 * A custom derivation path in the form `m/44'/0'/a'/0/0`
 * with 0-based account index `a`.
 * @param accIndex 0-based account index
 * @returns HD path
 */
function makeHDPath(accIndex: number): HdPath {
	const args = cryptoConfig.bip44.defaultHdPath.replaceAll("'", "").split("/");
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
async function getDerivedAccount(mnemonic: string, hdPath: HdPath): Promise<{ pubKey: string, privkey: string,  address: string }> {
	const wallet = await ThasaHdWallet.fromMnemonic(mnemonic, {
		hdPaths: [hdPath],
		prefix: "thasa",
	});

	const [{ pubkey, privkey, address }] = await wallet.getAccountsWithPrivkeys();

	return { pubKey: pubkey.toString(), privkey: privkey.toString(), address };
}

/**
 * 
 * @param plaintext data in utf-8 format
 * @param encryptionKey encryption key derived with pbkdf2 algo
 * @returns encrypted data and the iv used for encryption
 */
function encrypt(plaintext: string, encryptionKey: Buffer): { encrypted: Buffer, iv: Buffer } {
	const iv = crypto.randomBytes(cryptoConfig.aes.ivLength); // generate random iv
	const cipher = crypto.createCipheriv(
		cryptoConfig.aes.algorithm,
		encryptionKey,
		iv
	);
	const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
	return { encrypted, iv };
}

/**
 * 
 * @param encrypted encrypted data in the encoding format defined by cryptoConfig.encoding
 * @param encryptionKey encryption key derived with pbkdf2 algo
 * @param iv the iv used for encryption (encoding format same as *encrypted)
 * @returns decrypted data in utf-8 format
 */
function decrypt(encrypted: Buffer, encryptionKey: Buffer, iv: Buffer): string {
	const decipher = crypto.createDecipheriv(
		cryptoConfig.aes.algorithm,
		encryptionKey,
		iv
	);
	const decryptedData = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf-8");
	return decryptedData;
}

async function isValidPassword(password: string, passwordHash: string): Promise<boolean> {
	const valid = await bcrypt.compare(password, passwordHash);
	return valid;
}


async function getEncryptionKey(password: string, pbkdf2Salt: Buffer): Promise<Buffer> {
	const encryptionKey = await new Promise<Buffer>((resolve, reject) => crypto.pbkdf2(
		password,
		pbkdf2Salt,
		cryptoConfig.pbkdf2.iterations,
		cryptoConfig.pbkdf2.keyLength,
		cryptoConfig.pbkdf2.algorithm,
		(err, key) => {
			if (err) {
				reject(err);
			}
			resolve(key);
		}
	));
	return encryptionKey;
}

export {
	makeHDPath,
	getDerivedAccount,
	getEncryptionKey,
	encrypt,
	decrypt,
	isValidPassword,
	stringToHdPath,
	hdPathToString,
}