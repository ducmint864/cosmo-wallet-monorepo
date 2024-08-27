import {describe, expect, test} from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from "http-errors";
import {errorHandler} from "../../src/errors/middlewares/error-handler"; 
import {register} from '../../src/auth-module/controllers/auth'
import { prisma } from "../../src/connections";

/**
 * @dev error-handler mocking for register test
 */
jest.mock('../../src/errors/middlewares/error-handler');

/**
 * @dev prisma mock for database related test, preventing test to access actual database
 */
jest.mock("../../src/connections", () => ({
    prisma: {
      user_accounts: {
        create: jest.fn(), 
      },

      wallet_accounts: {
        create: jest.fn(),
      }
    },
}));

describe('register', () => {
    let res: Response;
    let mockNext: NextFunction;

    beforeEach(() => { 
        jest.clearAllMocks();

        res = 
        {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;

        mockNext = jest.fn();
    });

    it('should handle an error if missing email', async () => {
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

    it('should handle an error if missing password', async () => {
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

    it('should handle an error if email input unappropriately', async ()=> {
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

    it('should handle an error if password invalid', async () => {
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

    it('should handle error if username is invalid', async () => {
        /**
         * @dev  function checkUsernameAndThrow is being tested in credentials-helper.test.ts

         */

        // Arrange
        const req = ({
            body: {
                email: 'coolguy82@example.com',
                username: 'CG12',
                password: 'P@ssword123'
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
            message: expect.stringContaining("Invalid username:")
        });
    });

    describe('prisma mocking', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        })
        
        it('should throw unavailable username database error to error handler', async () => {
            // Arrange
            const req = ({
                body: {
                    email: 'coolguy82@example.com',
                    username: 'coolguy82',
                    password: 'P@ssw0rd'
                    }
            }) as Request;
    
            // Set up mock
    
            (prisma.user_accounts.create as jest.Mock)
                .mockRejectedValueOnce({
                    code: 'P2002',
                    meta: {
                        target: ['username']
                    }
                });
    
            const mockHandleError = errorHandler as jest.Mock;
            mockHandleError.mockImplementation((err, req, res, next) => {
                res.status(err.statusCode).json({ message: err.message });
            });
    
            // Act
    
            await register(req, res, mockNext);
        
            // Assert
            expect(mockHandleError).toHaveBeenCalledWith(
                expect.objectContaining({ code: 'P2002' }),
                req, 
                res,
                mockNext
            );
        });

        it('should handle the database error', async () => {
            /**
             * @dev we going to re-use the invalid username for this 
             * @note fail test
             * @note error-handler was able to receive the prisma error but can not handle it
             * @todo design a method to convert prisma error to http error so that error handler can work appropriately
             */
            
            const req = ({
                body: {
                    email: 'coolguy82@example.com',
                    username: 'coolguy82',
                    password: 'P@ssw0rd'
                    }
            }) as Request;
        
            // Set up mock
        
            (prisma.user_accounts.create as jest.Mock)
                .mockRejectedValueOnce({
                    code: 'P2002',
                    meta: {
                        target: ['username']
                    }
                });
        
            const mockHandleError = errorHandler as jest.Mock;
            mockHandleError.mockImplementation((err, req, res, next) => {
                res.status(err.statusCode).json({ message: err.message });
            });
        
            // Act    
        
            await register(req, res, mockNext);
        
            // Assert
            
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: expect.any(String) })
            );
        });
    });
});

