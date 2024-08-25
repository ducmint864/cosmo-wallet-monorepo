import {describe, expect, test} from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from "http-errors";
import {errorHandler} from "../../src/errors/middlewares/error-handler"; 
import {register} from '../../src/auth-module/controllers/auth'
import exp from 'constants';

jest.mock('../../src/errors/middlewares/error-handler');

describe('register', () => {
    let res: Response;
    let mockNext: NextFunction;

    beforeEach(() => { 
        res = 
        {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;

        mockNext = jest.fn();
    });

    it('should thow an error if missing email', async () => {
        // Arrange
        const req = ({
            body: {
                username: 'CoolGuy82',
                password: 'P@ssW0rd'
            }
        }) as Request;

        // Set up mock
        const mockHandleError = errorHandler as jest.Mock;
        mockHandleError.mockImplementation((err, req, res, next) => {
            res.status(err.statusCode).json({ message: err.message });
        });

        // Act
        await register(req, res, mockNext);

        // Assert
        expect(mockHandleError).toHaveBeenCalledWith(expect.any(HttpError), req, res, mockNext);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({message: "Missing credentials information"})
    });

    it('should thow an error if missing password', async () => {
        // Arrange
        const req = ({
            body: {
                email: 'coolguy82@example.com',
                username: 'CoolGuy82'
            }
        }) as Request;

        // Set up mock
        const mockHandleError = errorHandler as jest.Mock;
        mockHandleError.mockImplementation((err, req, res, next) => {
            res.status(err.statusCode).json({ message: err.message });
        });

        // Act
        await register(req, res, mockNext);

        // Assert
        expect(mockHandleError).toHaveBeenCalledWith(expect.any(HttpError), req, res, mockNext);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({message: "Missing credentials information"})
    }); 

    it('should throw an error if email input unappropriately', async ()=> {
        /**
         * @dev function checkEmailAndThrow is being tested in credentials-helper.test.ts
         */

        // Arrange
        const req = ({
            body: {
                email: 'invalid',
                username: 'CoolGuy82',
                password: 'P@ssW0rd'
            }
        }) as Request;
        
        // Set up mock
        const mockHandleError = errorHandler as jest.Mock;
        mockHandleError.mockImplementation((err, req, res, next) => {
            res.status(err.statusCode).json({ message: err.message });
        });
        
        // Act 
        await register(req, res, mockNext);

         // Assert
        expect(mockHandleError).toHaveBeenCalledWith(expect.any(HttpError), req, res, mockNext);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid email" });
    });

    it('should thow an error if password invalid', async () => {
        /**
         * @dev function checkPasswordAndThrow is being tested in credentials-helper.test.ts
         */

        // Arrange
        const req = ({
            body: {
                email: 'coolguy82@example.com',
                username: 'CoolGuy82',
                password: 'password'
            }
        }) as Request;

        // Set up mock
        const mockHandleError = errorHandler as jest.Mock;
        mockHandleError.mockImplementation((err, req, res, next) => {
            res.status(err.statusCode).json({ message: err.message });
        });

        // Act
        await register(req, res, mockNext);

        // Assert
        expect(mockHandleError).toHaveBeenCalledWith(expect.any(HttpError), req, res, mockNext);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: expect.stringContaining("Invalid password:")
        });
    });
});
