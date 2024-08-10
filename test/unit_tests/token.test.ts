import { genToken, decodeAndVerifyToken, isTokenInvalidated } from "../../src/general/helpers/jwt-helper";
import jwt, { Algorithm } from "jsonwebtoken";
import { UserAccountJwtPayload } from "../../src/types/BaseAccountJwtPayload";
import {redisClient} from "../../src/connections";
import { verify } from "crypto";
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

        (jwt.verify as jest.Mock).mockImplementation((token: string, pubKey: string) => {
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

    // it('return a valid token with provided decode algorithms', async () => {
    //     const payload: UserAccountJwtPayload = {
    //         userAccountId: 2,
    //     };
    //     const secret = "wakanda forever";
    //     const duration = "1hours";
    //     const algorithm1: Algorithm = "RS256";
    //     const algorithm2: Algorithm = "PS256";
    //     const algorithm3: Algorithm = "HS256";
        
    //     const token1 = genToken(payload, secret, duration, algorithm1);
    //     const token2 = genToken(payload, secret, duration, algorithm2);
    //     const token3 = genToken(payload, secret, duration, algorithm3);

    //     const decoded1 = jwt.verify(token1, secret, { algorithms: [algorithm1] });
    //     const decoded2 = jwt.verify(token2, secret, { algorithms: [algorithm2] });
    //     const decoded3 = jwt.verify(token3, secret, { algorithms: [algorithm3] });

    //     expect(decoded1).toEqual(payload);
    //     expect(decoded2).toEqual(payload);
    //     expect(decoded3).toEqual(payload);
    // });

    // it('should not return the payload with wrong token', ()=> {
    //     const payload: UserAccountJwtPayload = {
    //         userAccountId: 3,
    //     };
    //     const secret = "okay";
    //     const duration = "10minutes";

    //     const rightToken = genToken(payload, secret, duration);
    //     const wrongToken = "this is the wrong token";

    //     expect(jwt.verify(wrongToken, secret)).not.toBe(payload);
    //     expect(jwt.verify(rightToken, secret)).toBe(payload);
    // })
    
})

describe('decodeAndVerifyToken', () => {
    const publicKey = "mockPubKey";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the payload if the token is valid', () => {
        // Arrange
        const token = "valid-token";
        const payload: UserAccountJwtPayload = {userAccountId: 123};
        
        (jwt.verify as jest.Mock).mockImplementation((token: string) => {
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
        const token = "invalid-token";
        
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error("Invalid token");
          });
        
        // Act
        const result = decodeAndVerifyToken(token, publicKey);

        // Assert
        expect(jwt.verify).toHaveBeenCalledWith(token, publicKey);
        expect(result).toBeNull();
    });

    it('should return null if token is null', () => {
        // Arrange
        const token = "";

        // Act
        const result = decodeAndVerifyToken(token, publicKey);

        // Assert
        expect(result).toBeNull();
    });
})

jest.mock('../../src/connections', () => ({
    redisClient: {
        isOpen: false,
        connect: jest.fn(),
        get: jest.fn(),
    },
}));

describe('isTokenInvalidated', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('will connect to redis if redis is not already open', async () => {
        // Arrange
        Object.defineProperty(redisClient, 'isOpen', { value: false, writable: true });
        (redisClient.connect as jest.Mock).mockResolvedValue(undefined);
        (redisClient.get as jest.Mock).mockResolvedValue(null);

        // Act
        await isTokenInvalidated('testToken');

        //Assert
        expect(redisClient.connect).toHaveBeenCalledTimes(1);
    });
    
    it('should return true when received an error', async () => {
        // Arrange
        Object.defineProperty(redisClient, 'isOpen', { value: false, writable: true });
        (redisClient.connect as jest.Mock).mockResolvedValue(undefined);
        (redisClient.get as jest.Mock).mockRejectedValue(new Error('this is an error'));

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
        const result = await isTokenInvalidated('testToken');
        
        // Assert
        expect(result).toBe(true);
    });
})
