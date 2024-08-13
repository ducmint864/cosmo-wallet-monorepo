import {makeHDPath} from "../../src/general/helpers/crypto-helper"
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
    })

    it('should be able to derive path with increment index', async ()=> {
        for(let index: number = 0; index < 3; index++){
            const HD_Path: HdPath = makeHDPath(index);
            const expectedPath: string = `m/44'/0'/${index}'/0/0`

            expect(hdPathToString(HD_Path)).toBe(expectedPath);
        }
    })

    it('should return null when receive a negative index', () => {
        const accIndex: number = -1;

        const HD_Path: HdPath = makeHDPath(accIndex);
        
        expect(HD_Path).toBeNull();
    })
})

