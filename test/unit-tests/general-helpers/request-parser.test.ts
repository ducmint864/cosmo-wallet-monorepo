import { Request } from "express";
import {getBooleanQueryParam, getNumberArrayQueryParam, getStringFromRequestBody, getStringsFromRequestBody, getObjectFromRequestBody, getObjectsFromRequestBody} from "../../../src/general/helpers/request-parser";

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

    it('should be undefined if the query is empty', async () => {
        // Arrange
        const req = {
            query: {
            }
        } as unknown as Request;

        const paramName: string = "idk";

        // Act
        const result = getBooleanQueryParam(req, paramName);

        // Assert
        expect(result).toBeUndefined();
    });
});

describe('getNumberArrayQueryParam', () => {
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

    it('should be able to handle request contain large query', async () => {
        // Arrange
        const req = {
            query: {
                param: Array.from({ length: 100 }, (_, i) => i + 1).join(',')
            }
        } as unknown as Request;

        const paramName: string = "param";

        // Act
        const result = getNumberArrayQueryParam(req, paramName);

        // Assert
        expect(result).toBeDefined();
        expect(result).toStrictEqual(Array.from({ length: 100 }, (_, i) => i + 1));
    });

    it('should return empty array if the request query is empty', async () => {
        // Arrange
        const req = {
            query: {}
        } as unknown as Request;
        const paramName: string = "nothing";

        // Act
        const result = getNumberArrayQueryParam(req, paramName);

        // Assert
        expect(result).toBeDefined();
        expect(result).toStrictEqual([]);
    });
});

describe('getStringFromRequestBody', () => {
    it('should return a string from the request body', async () => {
        // Arrange
        const req = {
            body: {
                _key: "hello"
            }
        } as unknown as Request;

        const key: string = "_key";
       
        // Act
        const result = getStringFromRequestBody(req, key);

        // Assert
        expect(result).toBeDefined();
        expect(result).toBe("hello");
    });

    it('should return empty string when key is an empty string', async () => {
        // Arrange
        const req = {
            body: {
                _key: "hello"
            }
        } as unknown as Request;

        const key: string = "";
       
        // Act
        const result = getStringFromRequestBody(req, key);

        // Assert
        expect(result).toBe("");
    });

    it('should return empty string if the request body is empty', async () => {
        // Arrange
        const req = {
            body: {}
        } as unknown as Request;

        const key: string = "string";

        // Act
        const result = getStringFromRequestBody(req, key);

        // Assert
        expect(result).toBe("");
    });

    it('should be able to handle special character', async () => {
        // Arrange
        const req = {
            body: {
                "_key": "hello_world!"
            }
        } as unknown as Request;

        const key: string = "_key";

        // Act
        const result = getStringFromRequestBody(req, key);

        // Assert
        expect(result).toBe("hello_world!");
    });

    it('should be able to handle white space', async () => {
        // Arrange
        const req = {
            body: {
                "_key": "hello world"
            }
        } as unknown as Request;

        const key: string = "_key";

        // Act
        const result = getStringFromRequestBody(req, key);

        // Assert
        expect(result).toBe("hello world");
    });

    it('should be able to handle request contain large string', async () => {
        // Arrange
        const req = {
            body: {
                "_key": "a".repeat(10000)
            }
        } as unknown as Request;

        const key: string = "_key";

        // Act
        const result = getStringFromRequestBody(req, key);

        // Assert
        expect(result).toBe("a".repeat(10000));
    });
});

describe('getStringsFromRequestBody', () => {
    it('should be able to handle request contain multiple keys', async () => {
        // Arrange
        const req = {
            body: {
                "_key1": "hello-world!",
                "_key2": "goodbyeW0rld",
                "_key3": "gm_gn"
            }
        } as unknown as Request;

        const keys: string[] = ["_key1", "_key2", "_key3"];
        
        // Act
        const result = getStringsFromRequestBody(req, ...keys);

        // Assert
        expect(result).toBeDefined();
        expect(result).toStrictEqual({"_key1": "hello-world!", "_key2": "goodbyeW0rld", "_key3": "gm_gn"});
    });
});

describe('getObjectFromRequestBody', () => {
    it('should be able to handle request contain object', async () => {
        // Arrange
        const req = {
            body: {
                "_key": [
                    {
                        "name": "John",
                        "age": 30
                    }
                ]
            }
        } as unknown as Request;

        const key: string = "_key";

        // Act
        const result = getObjectFromRequestBody(req, key);

        // Assert
        expect(result).toBeDefined();
        expect(result).toStrictEqual([{
                "name": "John",
                "age": 30
        }]);
    });

    it('should be able to handle request contain string', async () => {
        // Arrange
        const req = {
            body: {
                "_key": '{"name": "Alice", "age": 25}'
            }
        } as unknown as Request;

        const key: string = "_key";

        // Act
        const result = getObjectFromRequestBody(req, key);

        // Assert
        expect(result).toBeDefined();
        expect(result).toStrictEqual({
            "name": "Alice", 
            "age": 25
        });
    });

    it('should return empty object when key is an empty string', async () => {
        // Arrange
        const req = {
            body: {
                _key: "hello"
            }
        } as unknown as Request;

        const key: string = "";
       
        // Act
        const result = getObjectFromRequestBody(req, key);

        // Assert
        expect(result).toStrictEqual({});
    });

    it('should return empty object if the request body is empty', async () => {
        // Arrange
        const req = {
            body: {}
        } as unknown as Request;

        const key: string = "string";

        // Act
        const result = getObjectFromRequestBody(req, key);

        // Assert
        expect(result).toStrictEqual({});
    });

    it('should be able to handle special character, white space, number and large value', async () => {
        // Arrange
        const req = {
            body: {
                "key": [
                    {
                        "string": "@hello world!",
                        "hugh_value": "a".repeat(10000),
                        "number": 123 
                    }
                ],
                "_key": '{"string": "hello_world!"}'
            }
        } as unknown as Request;

        const _key: string = "_key";
        const key: string = "key";

        // Act
        const _result = getObjectFromRequestBody(req, _key);
        const result = getObjectFromRequestBody(req, key);

        // Assert
        expect(_result).toStrictEqual({
            "string": "hello_world!"
        });
        expect(result).toStrictEqual([{
            "string": "@hello world!",
            "hugh_value": "a".repeat(10000),
            "number": 123          
        }]);
    });

    it('should return an empty object if it catch an error when parsing string', async () => {
        // Arrange
        const req = {
            body: {
                "key": "hello world"
            }
        } as unknown as Request;

        const key: string = "key";

        // Act
        const result = getObjectFromRequestBody(req, key);

        // Assert
        expect(result).toStrictEqual({});
    });
});

describe('getObjectsFromRequestBody', () => {
    it('should be able to handle array of objects', async () => {
        // Arrange
        const req = {
            body: {
                "key1": [
                    {
                        "string1": "hello",
                        "string2": "world"
                    }
                ],
                "key2": '{"string": "hello_world!"}',
                "key3": [
                    {
                        "name": "david",
                        "age": 30,
                        "paid": true,
                        "secret phrase": "hello world"
                    }
                ],
                "key4": '{"name": "Bill", "age": 44, "paid": false}',
                "key5": '"string": "hello ", "another string": "world ", "another another string": "!"',
            }
        } as unknown as Request;

        const keys: string[] = ['key1', 'key2', 'key3', 'key4', 'key5'];

        // Act
        const result = getObjectsFromRequestBody(req, ...keys);

        // Assert
        expect(result).toStrictEqual({
            "key1": [{"string1": "hello", "string2": "world"}], 
            "key2": {"string": "hello_world!"}, 
            "key3": [{"age": 30, "name": "david", "paid": true, "secret phrase": "hello world"}], 
            "key4": {"name": "Bill", "age": 44, "paid": false},
            "key5": {}
        });
    });
});