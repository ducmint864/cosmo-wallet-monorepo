import {describe, expect, test} from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from "http-errors";
import {errorHandler} from "../../src/errors/middlewares/error-handler"; 
import {register} from '../../src/auth-module/controllers/auth'
import { prisma } from "../../src/connections";
import {makeHDPath, getDerivedAccount, encrypt, decrypt, getEncryptionKey, getSigner} from "../../src/general/helpers/crypto-helper";
import { pathToString as hdPathToString, stringToPath as stringToHdPath } from "@cosmjs/crypto";
import bcrypt from "bcrypt";
import { randomBytes } from 'crypto';
import { cryptoConfig } from '../../src/config';

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
        /**
         * @dev the wallet and user data has been tested in crypto-helper.test.ts
         */
        beforeEach(() => {
            jest.clearAllMocks();
        });
        
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
             * @dev 🔥
             * @dev we going to re-use the invalid username for this 
             * @note error-handler was able to receive the prisma error but can not handle it
             * @todo design a method to convert prisma error to http error so that error handler can work appropriately
             */
            
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
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: expect.any(String) })
            );
        });

        it('should register a new user if all requirements are met', async () => {
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
                .mockResolvedValue({
                    data: {
                        email: req.body.email,
                        username: req.body.username,
                        password: expect.any(String),
                        crypto_mnemonic: expect.any(Buffer),
                        crypto_iv: expect.any(Buffer),
                        crypto_pbkdf2_salt: expect.any(Buffer)
                    }
                });
                
            (prisma.wallet_accounts.create as jest.Mock)
                .mockResolvedValue({
                    data: {
                        address: expect.any(String),
                        crypto_hd_path: expect.any(String),
                        nickname: "Account 0",
                        wallet_order: 1,
                        is_main_wallet: true,
                        user_account_id: expect.any(Number)
                    }
                });  

            // Act
            await register(req, res, mockNext);
        
            // Assert
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: "Register successful"
            });
        });

        it('should throw error 500 if it fail to register the user', async () => {
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
                .mockResolvedValue({
                    data: {
                        email: req.body.email,
                        username: req.body.username,
                        password: expect.any(String),
                        crypto_mnemonic: expect.any(Buffer),
                        crypto_iv: expect.any(Buffer),
                        crypto_pbkdf2_salt: expect.any(Buffer)
                    }
                });
            
            (prisma.wallet_accounts.create as jest.Mock)
                .mockResolvedValue(null);  

            // Act
    
            await register(req, res, mockNext);
        
            // Assert

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: "Failed to create derived account"
            });
        });
        
        describe('using crypto-helper for data testing', () => {
            /**
             * @dev arrange variables for crypto-helper
             */
            const mnemonic: string = "elder advance goddess fabric obtain machine reopen escape nation oppose narrow keep";
            const bip39Password: string = "onlygodknow";
            const hdPathStrings: string[] = [];

            const saltLenght: number = cryptoConfig.pbkdf2.saltLength;

            beforeEach(() => {
                jest.clearAllMocks();
            })

            it('should register user using data from crypto-helper functions', async () => {
                // Arrange
                const req = ({
                    body: {
                        email: 'coolguy82@example.com',
                        username: 'coolguy82',
                        password: 'P@ss_w0rd!'
                        }
                }) as Request;

                hdPathStrings.push(hdPathToString(makeHDPath(0)));

                const pkbdf2_salt: Buffer = Buffer.concat([Buffer.from
                    (`${req.body.email}${req.body.username}`), randomBytes(saltLenght)]);

                const encryptionKey: Buffer = await getEncryptionKey(req.body.password, pkbdf2_salt);
                const encrypted = encrypt(mnemonic, encryptionKey);

                const hashedPassword: string = await bcrypt.hash(req.body.password, cryptoConfig.bcrypt.saltRounds);

                // Set up mock
                (prisma.user_accounts.create as jest.Mock)
                .mockResolvedValue({
                    data: {
                        email: req.body.email,
                        username: req.body.username,
                        password: hashedPassword,
                        crypto_mnemonic: mnemonic,
                        crypto_iv: encrypted.iv,
                        crypto_pbkdf2_salt: pkbdf2_salt
                    }
                });

                const acc1 = await getDerivedAccount(mnemonic, stringToHdPath(hdPathStrings[0]));

                (prisma.wallet_accounts.create as jest.Mock)
                .mockResolvedValue({
                    data: {
                        address: acc1.address,
                        crypto_hd_path: hdPathStrings[0],
                        nickname: "Account 0",
                        wallet_order: 1,
                        is_main_wallet: true,
                        user_account_id: 0
                    }
                });  
               
                // Act
                await register(req, res, mockNext);

                // Assert
                expect(res.status).toHaveBeenCalledWith(201);
                expect(res.json).toHaveBeenCalledWith({
                    message: "Register successful"
                });
            });

            it('should have the valid wallet data', async () => {
                // Arrange
                const req = ({
                    body: {
                        email: 'coolguy82@example.com',
                        username: 'coolguy82',
                        password: 'P@ss_w0rd!'
                        }
                }) as Request;

                hdPathStrings.push(hdPathToString(makeHDPath(0)));

                const pkbdf2_salt: Buffer = Buffer.concat([Buffer.from
                    (`${req.body.email}${req.body.username}`), randomBytes(saltLenght)]);

                const encryptionKey: Buffer = await getEncryptionKey(req.body.password, pkbdf2_salt);
                const encrypted = encrypt(mnemonic, encryptionKey);

                const hashedPassword: string = await bcrypt.hash(req.body.password, cryptoConfig.bcrypt.saltRounds);

                // Set up mock
                (prisma.user_accounts.create as jest.Mock)
                .mockResolvedValue({
                    data: {
                        email: req.body.email,
                        username: req.body.username,
                        password: hashedPassword,
                        crypto_mnemonic: mnemonic,
                        crypto_iv: encrypted.iv,
                        crypto_pbkdf2_salt: pkbdf2_salt
                    }
                });

                const acc1 = await getDerivedAccount(mnemonic, stringToHdPath(hdPathStrings[0]));

                (prisma.wallet_accounts.create as jest.Mock)
                .mockResolvedValue({
                    data: {
                        address: acc1.address,
                        crypto_hd_path: hdPathStrings[0],
                        nickname: "Account 0",
                        wallet_order: 1,
                        is_main_wallet: true,
                        user_account_id: 0
                    }
                });  
               
                // Act
                await register(req, res, mockNext);

                // Assert
                expect(res.status).toHaveBeenCalledWith(201);
                expect(res.json).toHaveBeenCalledWith({
                    message: "Register successful"
                });

                const _mockResolvedValue = await (prisma.wallet_accounts.create as jest.Mock).mock.results[0].value
                expect(_mockResolvedValue.data.address.startsWith("thasa")).toBe(true);
                expect(_mockResolvedValue.data.crypto_hd_path).toBe("m/44'/0'/0'/0/0");
            });
        });
    });
});

