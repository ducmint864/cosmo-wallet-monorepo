import 'dotenv/config';
import { NextFunction, Request, Response } from 'express';
import { decodeAndVerifyToken } from '../helpers/jwt-helper';
import { prisma } from '../database/prisma';
import createError from 'http-errors';
import config  from '../config';

export const userAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.cookies.accessToken;
    if (token) {
        const decoded = decodeAndVerifyToken(token, config.auth.accessToken.secret);
        if (decoded instanceof Error) {
            const err = createError(400, 'Unauthorized access token');
            next(err);
        } else {
            if (!(prisma.base_account.findFirst({
                where: {
                    OR: [
                        { email: decoded.email },
                        { username: decoded.username }
                    ]
                }
            }))) {
                throw createError(401, 'Unknown identity');
            }

            next();
        }
    } else {
        const err = createError(400, 'Missing jwt');
        next(err);
    }
}

export default userAuth;