import { errorHandler } from "../../src/errors/middlewares/error-handler";
import createHttpError, { HttpError, CreateHttpError } from "http-errors";
import { Request, Response, NextFunction } from "express";

describe('error-handler', () => {
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

    it('should respond a 500 status code', async () => {
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
    });

    it('should respond a 409 status code for unavailable email', async () => {
        // Arrange
        const req: Request = {} as Request;

        // Act
        const error: HttpError = createHttpError("Unique constraint failed on the fields: (`email`)");
        errorHandler(error, req, res, mockNext);

        // Assert
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Email has been taken"
                })
            );
    });

    it('should respond a 409 code for unavailable username', async () => {
        // Arrange
        const req: Request = {} as Request;

        // Act
        const error: HttpError = createHttpError("Unique constraint failed on the fields: (`username`)");
        errorHandler(error, req, res, mockNext);

        // Assert
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Username has been taken"
            })
        );
    });
});