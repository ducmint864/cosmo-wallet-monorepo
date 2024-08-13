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
})