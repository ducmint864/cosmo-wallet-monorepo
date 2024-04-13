import * as crypto from "@cosmjs/crypto";
import { toBech32 } from "@cosmjs/encoding";
import { makeSignBytes } from "@cosmjs/proto-signing";
import { rawSecp256k1PubkeyToRawAddress, encodeSecp256k1Signature } from "@cosmjs/amino";
import { SignDoc } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { DirectSecp256k1HdWalletOptions } from "@cosmjs/proto-signing";
import { AccountData, DirectSignResponse, OfflineDirectSigner } from "@cosmjs/proto-signing";
import config from "../config";

const defaultOptions = {
	bip39Password: "",
	hdPaths: [crypto.stringToPath(config.crypto.bip44.defaultHdPath)],
	prefix: config.crypto.bech32.prefix,
};

export interface AccountDataWithPrivateKey extends AccountData {
	privkey: Uint8Array;
}

interface DirectSecp256k1HdWalletConstructorOptions extends Partial<DirectSecp256k1HdWalletOptions> {
	readonly seed: Uint8Array;
}
/** A wallet for protobuf based signing using SIGN_MODE_DIRECT */
export class ThasaHdWallet implements OfflineDirectSigner {

	/** Base secret */
	private readonly secret;
	/** BIP39 seed */
	private readonly seed;
	/** Derivation instructions */
	private readonly accounts;

	protected constructor(mnemonic: crypto.EnglishMnemonic, options: DirectSecp256k1HdWalletConstructorOptions) {
		const prefix = options.prefix ?? defaultOptions.prefix;
		const hdPaths = options.hdPaths ?? defaultOptions.hdPaths;
		this.secret = mnemonic;
		this.seed = options.seed;
		this.accounts = hdPaths.map((hdPath) => ({
			hdPath: hdPath,
			prefix: prefix,
		}));
	}


	/**
	 * Restores a wallet from the given BIP39 mnemonic.
	 *
	 * @param mnemonic Any valid English mnemonic.
	 * @param options An optional `DirectSecp256k1HdWalletOptions` object optionally containing a bip39Password, hdPaths, and prefix.
	 */
	static async fromMnemonic(mnemonic: string, options?: Partial<DirectSecp256k1HdWalletOptions>): Promise<ThasaHdWallet> {
		const mnemonicChecked = new crypto.EnglishMnemonic(mnemonic);
		const seed = await crypto.Bip39.mnemonicToSeed(mnemonicChecked, options.bip39Password);
		return new ThasaHdWallet(mnemonicChecked, {
			...options,
			seed: seed,
		});
	}

	/**
	 * Generates a new wallet with a BIP39 mnemonic of the given length.
	 *
	 * @param length The number of words in the mnemonic (12, 15, 18, 21 or 24).
	 * @param options An optional `DirectSecp256k1HdWalletOptions` object optionally containing a bip39Password, hdPaths, and prefix.
	 */
	static generate(length?: 12 | 15 | 18 | 21 | 24, options?: Partial<DirectSecp256k1HdWalletOptions>): Promise<ThasaHdWallet> {
		const entropyLength = 4 * Math.floor((11 * length) / 33);
		const entropy = crypto.Random.getBytes(entropyLength);
		const mnemonic = crypto.Bip39.encode(entropy);
		return ThasaHdWallet.fromMnemonic(mnemonic.toString(), options);
	}

	get mnemonic(): string {
		return this.secret.toString();
	}

	async getAccountsWithPrivkeys(): Promise<readonly AccountDataWithPrivateKey[]> {
		return Promise.all(this.accounts.map(async ({ hdPath }) => {
			const { privkey, pubkey } = await this.getKeyPair(hdPath);
			const address = toBech32(defaultOptions.prefix, rawSecp256k1PubkeyToRawAddress(pubkey));

			return {
				algo: "secp256k1",
				privkey: privkey,
				pubkey: pubkey,
				address: address,
			};
		}));
	}

	async getAccounts(): Promise<readonly AccountData[]> {
		const accounts = await this.getAccountsWithPrivkeys();
		return accounts.map(({ pubkey, address, algo }) => ({
			pubkey: pubkey,
			address: address,
			algo: algo
		}));
	}

	async getKeyPair(hdPath: crypto.HdPath): Promise<{ pubkey: Uint8Array, privkey: Uint8Array }> {
		const { privkey } = crypto.Slip10.derivePath(crypto.Slip10Curve.Secp256k1, this.seed, hdPath);
		const { pubkey } = await crypto.Secp256k1.makeKeypair(privkey);
		return {
			privkey: privkey,
			pubkey: crypto.Secp256k1.compressPubkey(pubkey),
		};
	}

	async signDirect(signerAddress: string, signDoc: SignDoc): Promise<DirectSignResponse> {
		const accounts = await this.getAccountsWithPrivkeys();
		const account = accounts.find(({ address }) => address === signerAddress);
		if (account === undefined) {
			throw new Error(`Address ${signerAddress} not found in wallet`);
		}
		const { privkey, pubkey } = account;
		const signBytes = makeSignBytes(signDoc);
		const hashedMessage = crypto.sha256(signBytes);
		const signature = await crypto.Secp256k1.createSignature(hashedMessage, privkey);
		const signatureBytes = new Uint8Array([...signature.r(32), ...signature.s(32)]);
		const stdSignature = encodeSecp256k1Signature(pubkey, signatureBytes);
		return {
			signed: signDoc,
			signature: stdSignature,
		};
	}
}