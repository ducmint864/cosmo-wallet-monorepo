import {makeHDPath, getDerivedAccount, encrypt, decrypt, getEncryptionKey} from "../../src/general/helpers/crypto-helper"
import {HdPath} from "@cosmjs/crypto"
import { cryptoConfig } from "../../src/config"
import { pathToString as hdPathToString, stringToPath as stringToHdPath } from "@cosmjs/crypto";
import { accessSync } from "fs";
import { DiffieHellmanGroup } from "crypto";
import { randomBytes } from "crypto";
import { buffer } from "stream/consumers";

describe('makeHDPath', ()=> {
    it('should return a HD path with provided index', async () =>{
        const accIndex: number = 19;

        const HD_Path: HdPath = makeHDPath(accIndex);
        const expectedPath: string = `m/44'/0'/19'/0/0`;

        expect(hdPathToString(HD_Path)).toBe(expectedPath);
    });

    it('should be able to derive path with increment index', async ()=> {
        for(let index: number = 0; index < 3; index++){
            const HD_Path: HdPath = makeHDPath(index);
            const expectedPath: string = `m/44'/0'/${index}'/0/0`

            expect(hdPathToString(HD_Path)).toBe(expectedPath);
        }
    });

    it('should return null when receive a negative index', () => {
        const accIndex: number = -1;

        const HD_Path: HdPath = makeHDPath(accIndex);
        
        expect(HD_Path).toBeNull();
    });
});

describe('getDerivedAcccount', () => {
    it('should derive an account from a mnemonic and hdPath', async () => {
        const mnemonic: string = "test test test test test test test test test test test junk";
        const hdPath: HdPath = stringToHdPath("m/44'/0'/0'/0/0");

        const derivedAccount = await getDerivedAccount(mnemonic, hdPath);
        const expectedAccount_address: string = 'thasa1jesugmy5wq9jejy3zz0llsaynvndrauwnpywh3';

        expect(derivedAccount.address).toBe(expectedAccount_address); 
    });

    it('should derive an account with a 24-word mnemonic', async () => {
        const mnemonic: string = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art";
        const hdPath: HdPath = stringToHdPath("m/44'/0'/0'/0/0");

        const derivedAccount = await getDerivedAccount(mnemonic, hdPath);
        const expectedAccount_address: string = 'thasa1ca600p6lwp84dzvrwxmyyjmwda3j34l64eusxv';

        expect(derivedAccount.address).toBe(expectedAccount_address);  
    });

    it('should catch checksum error when using an invalid mnemonic', async () => {
        const mnemonic: string = "test test test test test test test test test test test test";
        const hdPath: HdPath = stringToHdPath("m/44'/0'/0'/0/0");

        await expect(() => getDerivedAccount(mnemonic, hdPath))
            .rejects.toThrow("Invalid mnemonic checksum");
    });

    it('should return null when using an invalid HD path', async () => {
        const mnemonic: string = "test test test test test test test test test test test junk";
        const hdPath: HdPath = stringToHdPath("m/44'/0'/0'/0/1");

        const derivedAcc = await getDerivedAccount(mnemonic, hdPath);
        expect(derivedAcc).not.toBeNull();
    });

    it('should catch format error when mnemonic is an empty string', async () => {
        const mnemonic = "";
        const hdPath: HdPath = stringToHdPath("m/44'/0'/0'/0/0");

        await expect(() => getDerivedAccount(mnemonic, hdPath))
            .rejects.toThrow("Invalid mnemonic format");
    });
});


describe('encrypt and decrypt', () => {
    /**
     * @dev variables arrange for the tests
     */
    const saltLength: number = 32;
    const mnemonic: string = "test test test test test test test test test test test junk";
    const _email: string = "thisisanemail@gmail.com";
    const _username: string = "User";
    const _password: string = "password";
    const _pbkdf2Salt: Buffer = Buffer.concat([Buffer.from
            (`${_email}${_username}`), randomBytes(saltLength)]);
    
    describe('getEncryptionKey', () => {
        it('should return an encryption key', async () => {
            const encryptionKey: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);
            expect(encryptionKey).not.toBeNull();
        });
    })
    

    describe('encrypt', () => {
        it('should encrypt the mnemonic', async () => {
            const encryptionKey: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);
            
            const encryptedMnemonic = encrypt(mnemonic, encryptionKey);

            expect(encryptedMnemonic).not.toBeNull();
            expect(encryptedMnemonic.encrypted.toString())
                .not.toBe(mnemonic);
        });

        it('should return different encrypted information even same test-key pair', async () => {
            const encryptionKey: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);

            const encrypted1 = encrypt(mnemonic, encryptionKey);
            const encrypted2 = encrypt(mnemonic, encryptionKey);

            expect(encrypted1.encrypted.toString())
                .not.toEqual(encrypted2.encrypted.toString());
            expect(encrypted1.iv.toString())
                .not.toEqual(encrypted2.iv.toString());
        });
    })
    
    describe('decrypt', () => {
        it('should decrypt the mnemonic', async () => {
            const encryptionKey: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);

            const encryptedMnemonic = encrypt(mnemonic, encryptionKey);
            const decryptedMnemonic = decrypt(encryptedMnemonic.encrypted, encryptionKey, encryptedMnemonic.iv);

            expect(decryptedMnemonic).toEqual(mnemonic);
        })

        it('should return the same mnemonic when encrypt the same mnemonic', async () => {
            const encryptionKey: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);

            const encrypted1 = encrypt(mnemonic, encryptionKey);
            const encrypted2 = encrypt(mnemonic, encryptionKey);

            const decrypted1 = decrypt(encrypted1.encrypted, encryptionKey, encrypted1.iv);
            const decrypted2 = decrypt(encrypted2.encrypted, encryptionKey, encrypted2.iv);
            
            expect(decrypted1).toEqual(decrypted2);
        })

        it('should not return the same mnemonic when encrypt the same mnemonic but given different iv buffer', async () => {
            const encryptionKey: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);

            const encrypted1 = encrypt(mnemonic, encryptionKey);
            const encrypted2 = encrypt(mnemonic, encryptionKey);

            const decrypted = decrypt(encrypted1.encrypted, encryptionKey, encrypted2.iv);

            expect(decrypted).not.toEqual(mnemonic);
        })
    })
            
    describe('multi user testing', () => {

        const mnemonic2: string = "veteran voyage antique rule kit sample possible ceiling tank dismiss runway shadow";
        const _user2: string = "AwesomeGuy";
        const user2mail: string = "thisIsAwsome@gmail.com";
        const _pw: string = "confidential";
        const salt: Buffer = Buffer.concat([Buffer.from
            (`${user2mail},${_user2}`), randomBytes(saltLength)])

        it('should return the same mnemonic even using different key', async () => {
            const encryptionKey1: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);
            const encryptionKey2: Buffer = await getEncryptionKey(_pw, salt);

            const encrypted1 = encrypt(mnemonic, encryptionKey1);
            const encrypted2 = encrypt(mnemonic, encryptionKey2);

            const decrypted1 = decrypt(encrypted1.encrypted, encryptionKey1, encrypted1.iv);
            const decrypted2 = decrypt(encrypted2.encrypted, encryptionKey2, encrypted2.iv);

            expect(decrypted1).toEqual(decrypted2);
        })
    })
})