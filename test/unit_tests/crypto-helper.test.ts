import {makeHDPath, getDerivedAccount} from "../../src/general/helpers/crypto-helper"
import {HdPath} from "@cosmjs/crypto"
import { cryptoConfig } from "../../src/config"
import { pathToString as hdPathToString, stringToPath as stringToHdPath } from "@cosmjs/crypto";
import { accessSync } from "fs";

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
    })
})