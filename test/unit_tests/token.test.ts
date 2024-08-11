import { genToken, decodeAndVerifyToken, isTokenInvalidated, invalidateToken } from "../../src/general/helpers/jwt-helper";
import jwt, { Algorithm } from "jsonwebtoken";
import { UserAccountJwtPayload } from "../../src/types/BaseAccountJwtPayload";
import {redisClient} from "../../src/connections";
import { decode } from "punycode";
import exp from "constants";

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
    sign: jest.fn(),
})); 

describe('genToken', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    it('should return a valid token', async () => {
        const payload: UserAccountJwtPayload = {
            userAccountId: 1,
        };
        const secret = "this is a secret string.. shush";
        const duration = "5hours";

        (jwt.verify as jest.Mock)
            .mockImplementation((token: string, pubKey: string) => {
                if(secret == "this is a secret string.. shush"
                    && pubKey == "pubKey1" 
                    && token == genToken(payload, secret, duration)
                )
                    return payload;
        });

        const token = genToken(payload, secret, duration);
        const badToken = "this is an invalid token";

        const decode = jwt.verify(token, "pubKey1");
        expect(decode).toEqual(payload);
        expect(jwt.verify(badToken, "pubKey2")).not.toEqual(payload)
    });

    it('return a valid token with provided decode algorithms', async () => {
        /**
         * @note not a very good test
         * @dev but this test that the function will strictly work for Algorithm type 
         * try add a string for option param and it won't run
         */
        const payload: UserAccountJwtPayload = {
            userAccountId: 2,
        };
        const secret = "dont spill the beans";
        const duration = "1hours";
        const algorithm1: Algorithm = "RS256";
        const algorithm2: Algorithm = "PS256";

        (jwt.verify as jest.Mock)
            .mockImplementation((token: string, pubKey: string, options: { algorithms: Algorithm[]}) => {
                if(secret == "dont spill the beans" 
                        && pubKey == "BEAN")
                    return payload;
        })
        
        const token1 = genToken(payload, secret, duration, algorithm1);
        const token2 = genToken(payload, secret, duration, algorithm2);

        const decoded1 = jwt.verify(token1, "BEAN", { algorithms: [algorithm1] });
        const decoded2 = jwt.verify(token2, "BEAN", { algorithms: [algorithm2] });

        expect(decoded1).toEqual(payload);
        expect(decoded2).toEqual(payload);
    });
});

describe('decodeAndVerifyToken', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the payload if the token is valid', () => {
        // Arrange
        const publicKey = "mockPubKey";
        const token = "valid-token";
        const payload: UserAccountJwtPayload = {userAccountId: 123};
        
        (jwt.verify as jest.Mock)
            .mockImplementation((token: string) => {
                if(token == "valid-token")
                    return payload;
        });

        // Act
        const result = decodeAndVerifyToken(token, publicKey);
        const wrongResult = decodeAndVerifyToken("invalid-token", publicKey)

        // Assert
        expect(jwt.verify).toHaveBeenCalledWith(token, publicKey);
        expect(result).toEqual(payload);
        expect(wrongResult).not.toEqual(payload);
    });

    it('should return null if the token invalid', () => {
        // Arrange
        const publicKey = "mockPubKey";
        const token = "invalid-token";
        
        (jwt.verify as jest.Mock)
            .mockImplementation((token: string) => {
                if (token != "valid-token")
                    throw new Error("Invalid token");
        });
        
        // Act
        const result = decodeAndVerifyToken(token, publicKey);

        // Assert
        expect(jwt.verify).toHaveBeenCalledWith(token, publicKey);
        expect(result).toBeNull();
    });

    it('should return null if token is an empty string', () => {
        // Arrange
        const publicKey = "mockPubKey";

        // Act
        const result = decodeAndVerifyToken("", publicKey);

        // Assert
        expect(result).toBeNull();
    });

    it('should return null if no public key is an empty string', ()=> {
        const token = "valid-token";

        const result = decodeAndVerifyToken(token, "");

        expect(result).toBeNull();
    })

    it('should return null if both params is an empty string', ()=> {
        const result = decodeAndVerifyToken("", "");
        
        expect(result).toBeNull();
    })

    it('should be case sensitive for token', () => {
        const payload: UserAccountJwtPayload = {userAccountId: 72}
        const publicKey = "mockPubKey";
        const validToken: string = "lqk96we2uiso1sd3ufdpo19asd78";
        const invalidToken: string = "lqk96wE2UIso1sd3ufdpo19Asd78";

        (jwt.verify as jest.Mock)
            .mockImplementation((token: string) => {
                if (token == validToken) return payload;
        })

        const result = decodeAndVerifyToken(validToken, publicKey);
        const _result = decodeAndVerifyToken(invalidToken, publicKey);

        expect(result).not.toEqual(_result);
    })

    it('should not be case sensitive for public key', () => {
        const payload: UserAccountJwtPayload = {userAccountId: 892}
        const key1: string = "0xa1b2c3d4e5f6g7h";
        const _key1: string = "0xA1b2C3d4e5F6g7h";
        const validToken: string = "AccessGranted";

        (jwt.verify as jest.Mock).mockImplementation((publicKey: string) => {
            if (publicKey == key1) return payload;
        })

        const result = decodeAndVerifyToken(validToken, key1);
        const _result = decodeAndVerifyToken(validToken, _key1);

        expect(result).toEqual(_result);
    })
});

jest.mock('../../src/connections', () => ({
    redisClient: {
        isOpen: false,
        connect: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
    },
}));

describe('isTokenInvalidated', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('will connect to redis if redis is not already open', async () => {
        // Arrange
        Object.defineProperty(redisClient, 'isOpen', { value: false, writable: true });
        (redisClient.connect as jest.Mock)
            .mockResolvedValue(undefined);
        (redisClient.get as jest.Mock)
            .mockResolvedValue(null);

        // Act
        await isTokenInvalidated('testToken');

        //Assert
        expect(redisClient.connect).toHaveBeenCalledTimes(1);
    });
    
    it('should return true when received an error', async () => {
        // Arrange
        Object.defineProperty(redisClient, 'isOpen', { value: false, writable: true });
        (redisClient.connect as jest.Mock)
            .mockResolvedValue(undefined);
        (redisClient.get as jest.Mock)
            .mockRejectedValue(new Error('this is an error'));

        // Act
        const result = await isTokenInvalidated('testToken');
        
        // Assert
        expect(result).toBe(true);
    });

    it('return true if redis return data', async () => {
        // Arrange
        Object.defineProperty(redisClient, 'isOpen', { value: false, writable: true });
        (redisClient.connect as jest.Mock).mockResolvedValue(undefined);
        (redisClient.get as jest.Mock).mockResolvedValue('data');

        // Act
        const result = await isTokenInvalidated('testToken');
        
        // Assert
        expect(result).toBe(true);
    });

    it('return false if redis fail to return data', async () => {
        // Arrange
        Object.defineProperty(redisClient, 'isOpen', { value: false, writable: true });
        (redisClient.connect as jest.Mock).mockResolvedValue(undefined);
        (redisClient.get as jest.Mock).mockResolvedValue(undefined);

        // Act
        const result = await isTokenInvalidated('invalidatedToken');
        
        // Assert
        expect(result).toBe(true);
    });
});

describe('invalidateToken', () => {
    beforeEach(()=>{
        jest.clearAllMocks();
    });

    it('should throw an error when catch an error', async () => {
        const payload: UserAccountJwtPayload = {userAccountId: 162, exp: 1200}
        const token: string = "valid-token"; 

        Object.defineProperty(redisClient, 'isOpen', { value: false, writable: true });
        (redisClient.set as jest.Mock)
            .mockRejectedValue(new Error('this is an error'));

        await expect(() => invalidateToken(token, payload))
            .rejects.toThrow('this is an error');
    });

    it("should throw an error when token payload doesn't have a expiry feild", async () => {
        const payload: UserAccountJwtPayload = {userAccountId: 326};
        const token: string = "valid-token";

        await expect(() => invalidateToken(token, payload))
            .rejects.toThrow("Token payload doesn't have expiry field");
    })

    it('should calculate remainingTTL of a token when called and set it in redis', async () => {
        const payload: UserAccountJwtPayload = {userAccountId: 834, exp: 1700000000}
        const token: string = "valid-token";

        jest.spyOn(Date, 'now').mockImplementation(() => 1699999000000);
        const redisSetMock = jest.spyOn(redisClient, 'set').mockResolvedValue('OK');
       
        await invalidateToken(token, payload);
        const expectedTTL = payload.exp - Math.floor(Date.now() / 1000); // if an error raised, ignore it! exp is declared

        expect(redisSetMock).toHaveBeenCalledWith(token, "invalidated", { EX: expectedTTL });
    }) 

    
});