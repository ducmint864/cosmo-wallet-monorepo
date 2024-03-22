import { NextFunction, Request, Response } from 'express';
import { prisma } from '../database/prisma'
import { errorHandler } from '../middlewares/errors/error-handler';
import createError from 'http-errors';
import 'dotenv/config';


export async function retrieveEncryptedMnemonic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email: _email, username: _username } = req.body;
        const ba = await prisma.base_account.findFirst({
            where: {
                OR: [
                    {email: _email},
                    {username: _username}
                ]
            }
        });
        if (!ba) {
            throw createError(404, 'Data not found');
        }

        res.status(200).json({
            message: 'Request successful',
            data: { 
                'encrypted-mnemonic': ba.mnemonic
            }
        });
    } catch (err) {
        errorHandler(err, req, res, next);
    }
}