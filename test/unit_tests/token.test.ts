import { decodeAndVerifyToken, isTokenInvalidated } from "../../src/general/helpers/jwt-helper";
import jwt from "jsonwebtoken";
import { UserAccountJwtPayload } from "../../src/types/BaseAccountJwtPayload";
import {redisClient} from "../../src/connections";

jest.mock("jsonwebtoken");
jest.mock("../../src/connections");

describe('decodeAndVerifyToken', () => {
    const publicKey = "mockPubKey";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the payload if the token is valid', () => {
        // Arrange
        const token = "valid-token";
        const payload: UserAccountJwtPayload = {userAccountId: 123};
        
        (jwt.verify as jest.Mock).mockReturnValue(payload);

        // Act
        const result = decodeAndVerifyToken(token, publicKey);

        // Assert
        expect(jwt.verify).toHaveBeenCalledWith(token, publicKey);
        expect(result).toEqual(payload);
    })

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
    })

    it('should return null if token is null', () => {
        // Arrange
        const token = "";

        // Act
        const result = decodeAndVerifyToken(token, publicKey);

        // Assert
        expect(result).toBeNull();
    })
})

jest.mock('../../src/connections/redis/redis-client', () => ({
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
        Object.defineProperty(redisClient, 'isOpen', { value: false, writable: true });
        (redisClient.connect as jest.Mock).mockResolvedValue(undefined);
        (redisClient.get as jest.Mock).mockResolvedValue(null);

        await isTokenInvalidated('testToken');
        expect(redisClient.connect).toHaveBeenCalledTimes(1);
    });
    
    it('should return true when received an error', async () => {
        Object.defineProperty(redisClient, 'isOpen', { value: false, writable: true });
        (redisClient.connect as jest.Mock).mockResolvedValue(undefined);
        (redisClient.get as jest.Mock).mockRejectedValue(new Error('this is an error'));

        const result = await isTokenInvalidated('testToken');
        expect(result).toBe(true);
    })

    it('return true if redis return data', async () => {
        Object.defineProperty(redisClient, 'isOpen', { value: false, writable: true });
        (redisClient.connect as jest.Mock).mockResolvedValue(undefined);
        (redisClient.get as jest.Mock).mockResolvedValue('data');

        const result = await isTokenInvalidated('testToken');
        expect(result).toBe(true);
    })

    it('return false if redis fail to return data', async () => {
        Object.defineProperty(redisClient, 'isOpen', { value: false, writable: true });
        (redisClient.connect as jest.Mock).mockResolvedValue(undefined);
        (redisClient.get as jest.Mock).mockResolvedValue(undefined);

        const result = await isTokenInvalidated('testToken');
        expect(result).toBe(true);
    })
})