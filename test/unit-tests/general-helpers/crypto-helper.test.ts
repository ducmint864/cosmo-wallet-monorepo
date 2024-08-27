import {makeHDPath, getDerivedAccount, encrypt, decrypt, getEncryptionKey, getSigner} from "../../../src/general/helpers/crypto-helper";
import {HdPath} from "@cosmjs/crypto";
import { OfflineDirectSigner } from "@cosmjs/proto-signing";
import { pathToString as hdPathToString, stringToPath as stringToHdPath } from "@cosmjs/crypto";
import { randomBytes } from "crypto";

describe('makeHDPath', ()=> {
    it('should return a HD path with provided index', async () =>{
        // Arrange
        const accIndex: number = 19;

        // Act
        const HD_Path: HdPath = makeHDPath(accIndex);
        const expectedPath: string = `m/44'/0'/19'/0/0`;

        // Assert
        expect(hdPathToString(HD_Path)).toBe(expectedPath);
    });

    it('should be able to derive path with increment index', async ()=> {
        for(let index: number = 0; index < 3; index++){
            // Arrange and Act
            const HD_Path: HdPath = makeHDPath(index);
            const expectedPath: string = `m/44'/0'/${index}'/0/0`

            // Assert
            expect(hdPathToString(HD_Path)).toBe(expectedPath);
        }
    });

    it('should return null when receive a negative index', async () => {
        /**
         * @dev 🔥
         */
        // Arrange
        const accIndex: number = -1;

        // Act
        const HD_Path: HdPath = makeHDPath(accIndex);
        
        // Assert
        expect(HD_Path).toBeNull();
    });
});

describe('getDerivedAcccount', () => {
    it('should derive an account from a mnemonic and hdPath', async () => {
        // Arrange
        const mnemonic: string = "test test test test test test test test test test test junk";
        const HD_Path : HdPath = makeHDPath(0);

        // Act
        const derivedAccount = await getDerivedAccount(mnemonic, HD_Path)

        // Assert
        expect(derivedAccount).toBeDefined(); 
    });

    it('should derive an account with a 24-word mnemonic', async () => {
        // Arrange
        const mnemonic: string = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art";
        const HD_Path: HdPath = makeHDPath(0);

        // Act
        const derivedAccount = await getDerivedAccount(mnemonic, HD_Path);

        // Assert
        expect(derivedAccount).toBeDefined();  
    });

    it("should have a 'thasa' for derived account", async () => {
        // Arrange
        const mnemonic: string = "test test test test test test test test test test test junk";
        const HD_Path: HdPath = makeHDPath(0);

        // Act
        const derivedAccount = await getDerivedAccount(mnemonic, HD_Path);

        // Assert
        expect(derivedAccount.address.startsWith("thasa")).toBe(true);
    })

    it('should throw error when using a mnemonic that contain checksum error', async () => {
        // Arrange
        const mnemonic: string = "test test test test test test test test test test test test";
        const HD_Path: HdPath = makeHDPath(0);

        // Act - Asseert
        await expect(() => getDerivedAccount(mnemonic, HD_Path))
            .rejects.toThrow("Invalid mnemonic checksum");
    });

    it('should throw error when using a mnemonic that contain invalid word', async () => {
        // Arrange
        const mnemonic: string = "test test test test test stupid test test test test test invalid";
        const HD_Path: HdPath = makeHDPath(0);
        
        // Act - Assert
        await expect(() => getDerivedAccount(mnemonic, HD_Path))
            .rejects.toThrow("Mnemonic contains invalid word");
    });

    it('should throw error when using a mnemonic that have length error', async () => {
        // Arrsnge
        const mnemonic: string = "test test test test test";
        const HD_Path: HdPath = makeHDPath(0);
        
        // Act - Assert
        await expect(() => getDerivedAccount(mnemonic, HD_Path))
            .rejects.toThrow("Invalid word count in mnemonic")
    });

    it('should return null when using an invalid HD path', async () => {
        // Arrange
        const mnemonic: string = "test test test test test test test test test test test junk";
        const HD_Path: HdPath = makeHDPath(0);

        // Act
        const derivedAcc = await getDerivedAccount(mnemonic, HD_Path);
        
        // Assert
        expect(derivedAcc).not.toBeNull();
    });

    it('should catch format error when mnemonic is an empty string', async () => {
        // Arrange
        const mnemonic = "";
        const HD_Path: HdPath = makeHDPath(0);

        // Act and Assert
        await expect(() => getDerivedAccount(mnemonic, HD_Path))
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
            // Act
            const encryptionKey: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);
            
            // Assert
            expect(encryptionKey).not.toBeNull();
        });
    })
    

    describe('encrypt', () => {
        it('should encrypt the mnemonic', async () => {
            // Arrange
            const encryptionKey: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);
            
            // Act
            const encryptedMnemonic = encrypt(mnemonic, encryptionKey);

            // Assert
            expect(encryptedMnemonic).not.toBeNull();
            expect(encryptedMnemonic.encrypted.toString())
                .not.toBe(mnemonic);
        });

        it('should return different encrypted information even same test-key pair', async () => {
            // Arrange
            const encryptionKey: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);

            // Act
            const encrypted1 = encrypt(mnemonic, encryptionKey);
            const encrypted2 = encrypt(mnemonic, encryptionKey);

            // Assert
            expect(encrypted1.encrypted.toString())
                .not.toEqual(encrypted2.encrypted.toString());
            expect(encrypted1.iv.toString())
                .not.toEqual(encrypted2.iv.toString());
        });

        it('should not encrypt an empty string', async() => {
            /**
             * @dev 🔥
             * @todo encrypt is strictly use for mnemonic, it should not be encrypted everything
             */
            // Arrange
            const encryptionKey: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);

            // Act
            const encrypted = encrypt("", encryptionKey);

            // Assert
            expect(encrypted).toBeNull();
        });

        it('should be able to re-encrypt', async () => {
            // Arrange
            const encryptionKey: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);
            const encrypted = encrypt(mnemonic, encryptionKey);

            // Act
            const re_encrypted = encrypt(encrypted.encrypted.toString(), encryptionKey);

            // Assert
            expect(re_encrypted.encrypted.toString()).not.toBeNull;
        })
    })
    
    describe('decrypt', () => {
        it('should decrypt the mnemonic', async () => {
            // Arrange
            const encryptionKey: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);

            // Act 
            const encryptedMnemonic = encrypt(mnemonic, encryptionKey);
            const decryptedMnemonic = decrypt(encryptedMnemonic.encrypted, encryptionKey, encryptedMnemonic.iv);

            // Assert
            expect(decryptedMnemonic).toEqual(mnemonic);
        });

        it('should return the same mnemonic when encrypt the same mnemonic', async () => {
            // Arrange
            const encryptionKey: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);

            // Act
            const encrypted1 = encrypt(mnemonic, encryptionKey);
            const encrypted2 = encrypt(mnemonic, encryptionKey);

            const decrypted1 = decrypt(encrypted1.encrypted, encryptionKey, encrypted1.iv);
            const decrypted2 = decrypt(encrypted2.encrypted, encryptionKey, encrypted2.iv);
            
            // Assert
            expect(decrypted1).toEqual(decrypted2);
        });

        it('should not return the same mnemonic when encrypt the same mnemonic but given different iv buffer', async () => {
            // Arrange
            const encryptionKey: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);

            // Act
            const encrypted1 = encrypt(mnemonic, encryptionKey);
            const encrypted2 = encrypt(mnemonic, encryptionKey);

            const decrypted = decrypt(encrypted1.encrypted, encryptionKey, encrypted2.iv);

            // Assert
            expect(decrypted).not.toEqual(mnemonic);
        });

        it('should not return the same mnemonic with injected iv buffer', async () => {
            // Arrange
            const encryptionKey: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);
            const iv = Buffer.alloc(16, 0x00);

            // Act
            const encrypted = encrypt(mnemonic, encryptionKey);
            const decrypted = decrypt(encrypted.encrypted, encryptionKey, iv);
            
            // Assert
            expect(iv.toString()).not.toEqual(encrypted.iv.toString());
            expect(mnemonic).not.toEqual(decrypted);
        });

        it('should throw an error object when decrypt with a corrupted encrypted buffer', async () => {
            // Arrange
            const encryptionKey: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);

            const encrypted = encrypt(mnemonic, encryptionKey);
            encrypted.encrypted = Buffer.alloc(32, 0x00);
            // Act and Assert
            try {
                decrypt(encrypted.encrypted, encryptionKey, encrypted.iv);
            } catch (error) {
                expect(error.reason).toBe('bad decrypt');
                expect(error.code).toBe('ERR_OSSL_BAD_DECRYPT');
            }
        });

        it('should throw an error when the decrypt with key that got corrupted salt', async () => {
            // Arrange
            const encryptionKey: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);
            const salt: Buffer = Buffer.from(_pbkdf2Salt);
            salt[0] ^= 0xFF;
            const corruptedEncryptionKey = await getEncryptionKey(_password, salt);
            
            const encrypted = encrypt(mnemonic, encryptionKey);

            // Act and Assert
            try {
                decrypt(encrypted.encrypted, corruptedEncryptionKey, encrypted.iv);
            } catch (error) {
                expect(error.reason).toBe('bad decrypt');
                expect(error.code).toBe('ERR_OSSL_BAD_DECRYPT');
            }
        })

        it('should be able to decrypt a 2 layer encrypted', async () => {
            /**
             * @dev 🔥
             * @note the commented code will return a succesful test, uncomment it in case this test meant to fail
             */
            // Arrange
            const encryptionKey: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);
            const encrypted = encrypt(mnemonic, encryptionKey);
            const re_encrypted = encrypt(encrypted.encrypted.toString(), encryptionKey);
            const decrypted = decrypt(re_encrypted.encrypted, encryptionKey, re_encrypted.iv);
            const decryptedToBuffer = Buffer.from(decrypted, 'utf-8');
            
            // Act
            const second_decrypted = decrypt(decryptedToBuffer, encryptionKey, encrypted.iv);
            
            // Assert
            expect(second_decrypted).toEqual(mnemonic);

            /**
             * @note If the test meant to fail this part is Act and Assert 
            */ 
            // try {
            //     decrypt(decryptedToBuffer, encryptionKey, encrypted.iv);
            // } catch (error) {
            //     console.log(error);
            //     expect(error.reason).toBe('wrong final block length');
            //     expect(error.code).toBe('ERR_OSSL_WRONG_FINAL_BLOCK_LENGTH');
            // }
        });
    })
            
    describe('multi users testing', () => {
        /**
         * @dev arrange variables to use for the following tests
         */
        const mnemonic2: string = "veteran voyage antique rule kit sample possible ceiling tank dismiss runway shadow";
        const _user2: string = "AwesomeGuy";
        const user2mail: string = "thisIsAwsome@gmail.com";
        const _pw: string = "confidential";
        const salt: Buffer = Buffer.concat([Buffer.from
            (`${user2mail},${_user2}`), randomBytes(saltLength)])

        it('should return the same mnemonic even using different key', async () => {
            // Arrange
            const encryptionKey1: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);
            const encryptionKey2: Buffer = await getEncryptionKey(_pw, salt);

            const encrypted1 = encrypt(mnemonic, encryptionKey1);
            const encrypted2 = encrypt(mnemonic, encryptionKey2);

            // Act
            const decrypted1 = decrypt(encrypted1.encrypted, encryptionKey1, encrypted1.iv);
            const decrypted2 = decrypt(encrypted2.encrypted, encryptionKey2, encrypted2.iv);

            // Assert
            expect(decrypted1).toEqual(decrypted2);
        });

        it('should throw an error object when decrypt user A mnemonic if using user B key', async () => {
            /**
             * @dev encrypt and decrypt are sync function not async
             * Therefore, test for expected error must not handle with .rejects
             */

            // Arrange
            const encryptionKey1: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);
            const encryptionKey2: Buffer = await getEncryptionKey(_pw, salt);

            const encrypted = encrypt(mnemonic, encryptionKey1);

            // Act and Assert
            try {
                decrypt(encrypted.encrypted, encryptionKey2, encrypted.iv);
            } catch (error) {
                expect(error.reason).toBe('bad decrypt');
                expect(error.code).toBe('ERR_OSSL_BAD_DECRYPT');
            }
        });

        it('should not decrypt user A mnemonic if using user B iv buffer', async () => {
            // Arrange
            const encryptionKey1: Buffer = await getEncryptionKey(_password, _pbkdf2Salt);
            const encryptionKey2: Buffer = await getEncryptionKey(_pw, salt);

            const encrypted = encrypt(mnemonic, encryptionKey1);
            const encrypted2 = encrypt(mnemonic2, encryptionKey2);

            // Act
            const decrypted = decrypt(encrypted.encrypted, encryptionKey1, encrypted2.iv);

            // Assert
            expect(decrypted).not.toEqual(mnemonic);
        });  
    })
});

describe('getSinger', () => {
    /**
     * @dev arrange varables for the following tests
     */
    const mnemonic: string = "test test test test test test test test test test test junk";
    const bip39Password: string = "supersecurepasswordthatonlygodknow";
    
    it('should return a signer', async () => {
        // Arrange
        const hdPathStrings = ["m/44'/0'/0'/0/0"];

        // Act
        const Signer: OfflineDirectSigner = await getSigner(mnemonic, bip39Password, ...hdPathStrings);

        // Assert
        expect(Signer).toBeDefined();
    });

    it('should return a signer without a bip39 password', async () => {
        // Arrange
        const hdPathStrings = ["m/44'/0'/0'/0/0"];
        
        // Act
        const Signer: OfflineDirectSigner = await getSigner(mnemonic, undefined, ...hdPathStrings);

        // Assert
        expect(Signer).toBeDefined();
    });

    it("should get account that have 'thasa' prefix", async () => {
        // Arrange
        const hdPathStrings = ["m/44'/0'/0'/0/0"];

        // Act
        const Signer: OfflineDirectSigner = await getSigner(mnemonic, bip39Password, ...hdPathStrings);

        const accounts = await Signer.getAccounts();
        
        // Assert
        expect(accounts[0].address.startsWith("thasa")).toBe(true);
    });
    
    it('should be able to get all accounts according to provided hd paths', async () => {
        // Arrange
        const hdPathStrings = ["m/44'/0'/0'/0/0", "m/44'/0'/1'/0/0", "m/44'/0'/2'/0/0"];

        // Act
        const Signer: OfflineDirectSigner = await getSigner(mnemonic, bip39Password, ...hdPathStrings);

        const accounts = await Signer.getAccounts();
        
        // Assert
        expect(accounts).toBeDefined();
        expect(accounts).toHaveLength(3);
        expect(accounts[0].address.startsWith("thasa")).toBe(true);
        expect(accounts[1].address.startsWith("thasa")).toBe(true);
        expect(accounts[2].address.startsWith("thasa")).toBe(true);
    });

    it('should work with hd path make from makeHDPath', async () => {
        // Arange
        const hdPathStrings: string[] = [];
        hdPathStrings.push(hdPathToString(makeHDPath(0)));
        hdPathStrings.push(hdPathToString(makeHDPath(1)));

        // Act
        const Signer: OfflineDirectSigner = await getSigner(mnemonic, undefined, ...hdPathStrings);

        const accounts = await Signer.getAccounts();

        // Assert
        expect(accounts).toBeDefined();
        expect(accounts).toHaveLength(2);
        expect(accounts[0].address.startsWith("thasa")).toBe(true);
        expect(accounts[1].address.startsWith("thasa")).toBe(true);
    });
    
    it('should throw an error when provide an invalid length mnemonic', async () => {
        // Arrange
        const hdPathStrings = ["m/44'/0'/0'/0/0"];
        const invalid_mnemonic: string = "this string made by a human";

        // Act and Assert
        await expect(() => getSigner(invalid_mnemonic, bip39Password, ...hdPathStrings))
                .rejects.toThrow("Invalid word count in mnemonic");
    });

    it('should throw error when provide a mnmonic that contain an invalid word', async () => {
        // Arrange
        const hdPathStrings = ["m/44'/0'/0'/0/0"];
        const invalid_mnemonic: string = "strategy hub faith gospel put stupid under spray elite fetch veteran image";

        // Act and Assert
        await expect(() => getSigner(invalid_mnemonic, bip39Password, ...hdPathStrings))
                .rejects.toThrow("Mnemonic contains invalid word");
    });

    it('should throw an error when provide a mnemonic with a checksum error', async () => {
        // Arrange
        const hdPathStrings = ["m/44'/0'/0'/0/0"];
        const invalid_mnemonic: string = "strategy hub faith gospel put test under spray elite fetch veteran image";
        
        // Act and Assert
        await expect(() => getSigner(invalid_mnemonic, bip39Password, ...hdPathStrings))
                .rejects.toThrow("Invalid mnemonic checksum");
    });

    it('should return 0 account when given an empty hdPath array', async () => {
        // Arrange
        const hdPathStrings: string[] = [];

        //Act
        const Signer: OfflineDirectSigner = await getSigner(mnemonic, bip39Password, ...hdPathStrings);
        const accounts = await Signer.getAccounts();
        
        // Assert
        expect(accounts).toHaveLength(0);
    });

    it('should derive the same account like getDerivedAccount function if not using bip39password', async () => {
        // Arrange
        const hdPathStrings = ["m/44'/0'/0'/0/0"];
        
        // Act
        const Signer: OfflineDirectSigner = await getSigner(mnemonic, undefined, ...hdPathStrings);
        const accounts = await Signer.getAccounts();
        const derivedAcc = await getDerivedAccount(mnemonic, stringToHdPath(hdPathStrings[0]));

        // Assert
        expect(accounts[0].address).toEqual(derivedAcc.address);
    })

    it('should not derive the same account like getDerivedAccount function if using bip39password', async () => {
        // Arrange
        const hdPathStrings = ["m/44'/0'/0'/0/0"];
        
        // Act
        const Signer: OfflineDirectSigner = await getSigner(mnemonic, bip39Password, ...hdPathStrings);
        const accounts = await Signer.getAccounts();
        const derivedAcc = await getDerivedAccount(mnemonic, stringToHdPath(hdPathStrings[0]));

        // Assert
        expect(accounts[0].address).not.toEqual(derivedAcc.address);
    })
})

describe('FINAL TEST', () => {
    it('SHOULD BE WORKING', async () => {
        /**
         * @dev this test will utilized all the function from crypto-helper 
         */
        const mnemonic: string = "elder advance goddess fabric obtain machine reopen escape nation oppose narrow keep";
        const bip39Password: string = "onlygodknow";
        const hdPathStrings: string[] = [];
        
        for(let index: number = 0; index < 3; index++) {
            hdPathStrings.push(hdPathToString(makeHDPath(0)));
        }

        const username: string = "human";
        const password: string = "notrobot";
        const email: string = "iamhuman@gmail.com";
        const saltLength: number = 32;
        const pbkdf2Salt: Buffer = Buffer.concat([Buffer.from
            (`${email}${username}`), randomBytes(saltLength)]);

        // Using getEncryptionKey to generate an enccryptionKey with Buffer datatype 
        const encryptionKey: Buffer = await getEncryptionKey(password, pbkdf2Salt);
        // Using encrypt to encrypt the arranged mnemonic
        const encrypted_mnemonic = encrypt(mnemonic, encryptionKey);
        // Using decrypt to then decrypt the encrypted mnemonic using the same encryptionKey and the encrypted iv
        const decrypted = decrypt(encrypted_mnemonic.encrypted, encryptionKey, encrypted_mnemonic.iv);
        
        // If decrypt function work as expected decypted should be the mnemonic we encrypted
        expect(decrypted).toEqual(mnemonic);

        // Derive an account with the mnemonic
        const acc1 = await getDerivedAccount(decrypted, stringToHdPath(hdPathStrings[1]));
        expect(acc1).toBeDefined();

        // Using getSigner and provide bip39password
        const signer: OfflineDirectSigner = await getSigner(decrypted, bip39Password, ...hdPathStrings);
        const accounts = await signer.getAccounts();
        expect(acc1.address.startsWith("thasa")).toBe(true);

        // signer and accounts should exist and be retrieve accordingly the provided hd paths
        expect(signer).toBeDefined();
        expect(accounts).toBeDefined();
        expect(accounts).toHaveLength(3);
        expect(accounts[0].address.startsWith("thasa")).toBe(true);
            
        // Because providing bip39password the derive method is different the account retrieve from getSigner should be different then the one from getDerivedAccount
        expect(acc1.address).not.toEqual(accounts[1].address);

        // Using getSinger without bip39password
        const _signer: OfflineDirectSigner = await getSigner(decrypted, undefined, ...hdPathStrings);
        const _accounts = await _signer.getAccounts();

        // Without bip39password getSigner method of derivation should be the same as getDerivedAccount
        expect(acc1.address).toEqual(_accounts[1].address);
    });
});