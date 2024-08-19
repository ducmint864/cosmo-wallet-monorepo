import {describe, expect, test} from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import {register} from '../../src/auth-module/controllers/auth'

const mockRequest = (body: any): Partial<Request> => ({
    body,
  });
  
const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext: NextFunction = jest.fn();

describe('register', () => {
    afterEach(() => {
        jest.clearAllMocks();
    })

    it('should return "Invalid email" if email input unappropriately', async ()=> {
        // Arrange
        const req = mockRequest({
             email: 'invalid_email', 
             username: 'dummy', 
             password: 'password123'}) as Request;
        const res = mockResponse() as Response;

        // Act
        await register(req, res, mockNext);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({message: "Invalid email"});
        expect(mockNext).not.toHaveBeenCalled();
    })
})
