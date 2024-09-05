import {describe, expect, test} from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import createHttpError, {HttpError} from "http-errors"
import {errorHandler} from "../../src/errors/middlewares/error-handler"; 
import { register } from '../../src/auth-module/controllers/auth'

describe('error-handler need to work appropriately', () => {
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

    it('should handle the error if error-handler catch an error', async () => {
        // Arrange
        const req: Request = {} as Request;

        // Act
        const error: HttpError = createHttpError('Internal Server Error');
        errorHandler(error, req, res, mockNext);

        // Assert
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith( 
            expect.objectContaining({
                message: 'Internal Server Error',
            })
        )
    })

    it('should handle the error if the error is caught by middleware', async () => {
        // Arrange
        const req = ({
            body: {
                username: 'CoolGuy82',
                password: 'P@ssW0rd',
            },
        }) as Request; // req missing email

        // Spy on the errorHandler to check if it's called
        const errorHandlerSpy = jest.spyOn(require('../../src/errors/middlewares/error-handler'), 'errorHandler');
        
        // Act
        await register(req, res, mockNext); // This will throw an error internally, which should be handled by the middleware

        // Assert
        expect(errorHandlerSpy).toHaveBeenCalled(); // Ensure the error handler was called
        expect(res.status).toHaveBeenCalledWith(400); // Verify the status code was set
        expect(res.json).toHaveBeenCalledWith({ message: 'Missing credentials information' }); // Verify the response content
    });

    it ('should handle the error if the error pass from a different function', async () => {
        // Arrange
        const req = ({
           body: {
               username: 'CoolGuy82',
               password: 'P@ssW0rd'
           }
       }) as Request; // req missing email

       // Act
       await register(req, res, mockNext);

       // Assert
       // expect(errorHandler).toHaveBeenCalledWith(expect.any(HttpError), req, res, mockNext);
       expect(res.status).toHaveBeenCalledWith(400);
       expect(res.json).toHaveBeenCalledWith({message: "Missing credentials information"})
   })
})