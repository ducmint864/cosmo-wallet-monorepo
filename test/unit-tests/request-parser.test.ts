import { Request } from "express";
import {getBooleanQueryParam, getNumberArrayQueryParam} from "../../src/general/helpers/request-parser";

describe('getBooleanQueryParam', () => {
    it('should return true when param value is true', async () => {
        // Arrange
        const req = {
            query: {
                param1: 'true',
                param2: 'false',
                param3: '',
                param4: 'invalid',
                param5: 'TRUE',
                param6: 'TrUe'
            }
        } as unknown as Request;

        const paramName: string = "param1";

        // Act
        const result = getBooleanQueryParam(req, paramName);

        // Assert
        expect(result).toBe(true);
    });

    it('should return false when param value is false', async () => {
        // Arrange
        const req = {
            query: {
                param1: 'true',
                param2: 'false',
                param3: '',
                param4: 'invalid',
                param5: 'TRUE',
                param6: 'TrUe'
            }
        } as unknown as Request;

        const paramName: string = "param2";

        // Act
        const result = getBooleanQueryParam(req, paramName);

        // Assert
        expect(result).toBe(false);
    });

    it('should return false when param value is null', async () => {
        // Arrange
        const req = {
            query: {
                param1: 'true',
                param2: 'false',
                param3: '',
                param4: 'invalid',
                param5: 'TRUE',
                param6: 'TrUe'
            }
        } as unknown as Request;

        const paramName: string = "param3";

        // Act
        const result = getBooleanQueryParam(req, paramName);

        // Assert
        expect(result).toBe(false);
    });

    it('should return false when param value is invalid', async () => {
        // Arrange
        const req = {
            query: {
                param1: 'true',
                param2: 'false',
                param3: '',
                param4: 'invalid',
                param5: 'TRUE',
                param6: 'TrUe'
            }
        } as unknown as Request;

        const paramName: string = "param4";

        // Act
        const result = getBooleanQueryParam(req, paramName);

        // Assert
        expect(result).toBe(false);
    });

    it('should return false when param value is invalid', async () => {
        // Arrange
        const req = {
            query: {
                param1: 'true',
                param2: 'false',
                param3: '',
                param4: 'invalid',
                param5: 'TRUE',
                param6: 'TrUe'
            }
        } as unknown as Request;

        const paramName: string = "param4";

        // Act
        const result = getBooleanQueryParam(req, paramName);

        // Assert
        expect(result).toBe(false);
    });
    
    it('should return true when param value is true but contain uppercase letter', async () => {
        // Arrange
        const req = {
            query: {
                param1: 'true',
                param2: 'false',
                param3: '',
                param4: 'invalid',
                param5: 'TRUE',
                param6: 'TrUe'
            }
        } as unknown as Request;

        const paramName1: string = "param5";
        const paramName2: string = "param6";

        // Act
        const result1 = getBooleanQueryParam(req, paramName1);
        const result2 = getBooleanQueryParam(req, paramName2);

        // Assert
        expect(result1).toBe(true);
        expect(result2).toBe(true);
    });
});

describe('getNumberArratQueryParam', () => {
    it('should return a number array after parse each string from the string array', async () => {
        // Arrange
        const req = {
            query: {
                param: [
                    "378", "hello", "world", "5tring"
                ]
            }
        } as unknown as Request;

        const paramName: string = "param";

        // Act
        const result = getNumberArrayQueryParam(req, paramName);

        // Assert
        expect(result).toBeDefined();
        expect(result).toStrictEqual([378, 5])
    });

    it('should return a number after parse a string', async () => {
        // Arrange
        const req = {
            query: {
                param1: "71",
                param2: "NaN123"
            }
        } as unknown as Request;

        const paramName1: string = "param1";
        const paramName2: string = "param2";

        // Act
        const result1 = getNumberArrayQueryParam(req, paramName1);
        const result2 = getNumberArrayQueryParam(req, paramName2);

        // Assert
        expect(result1).toBeDefined();
        expect(result2).toBeDefined();
        expect(result1).toStrictEqual([71]);
        expect(result2).toStrictEqual([]);
    });
});