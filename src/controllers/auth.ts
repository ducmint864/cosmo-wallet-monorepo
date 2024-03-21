import { NextFunction, Request, Response } from 'express';
import { DirectSecp256k1HdWallet, DirectSecp256k1HdWalletOptions } from '@cosmjs/proto-signing';
import { prisma } from '../database/prisma'
import { errorHandler } from '../middlewares/errors/error-handler';
import createError from 'http-errors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import 'dotenv/config';

const secretAccessTok = process.env.ACCESS_TOKEN_SECRET;

function validateEmail(email: string): void {
    if (false) {
        throw createError(400, 'Invalid email');
    }
}

function validateUsername(username: string): void {
    if (false) {
        throw createError(400, 'Invalid username');
    }
}

function validatePassword(password: string): void {
    if (false) {
        throw createError(400, 'Invalid password');
    };
}

function genUsername(): string {
    const userNum = prisma.base_account.count()
    return `user${userNum}`;
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let { email: _email, username: _username, password: _password } = req.body;
        
        // Basic validation
        validateEmail(_email);
        validatePassword(_password);
        if (_username) {
            validateUsername(_username)
        } else {
            _username = genUsername();
        }
        
        // Password-hashing
        const hashedPassword = await bcrypt.hash(_password, 10);
        
        // Encrypt mnemonic
        const wallet = DirectSecp256k1HdWallet.generate(24, {
            prefix: 'thasa'
        });

        const encryptionKey = crypto.pbkdf2Sync(_password, _username, 100, 32, 'sha256');
        const encryptedMnemonic = 'a';

        
        const newAcc = await prisma.base_account.create({
            data: {
                email: _email,
                username: _username,
                password: hashedPassword,
                mnemonic: encryptedMnemonic
            }
        });
        if (!newAcc) {
            throw createError(500, 'Internal server error');
        }

        // Send access token to user
        const duration = 600; // 10 minutes in seconds
        const token = jwt.sign(
            { username: newAcc.username },
            secretAccessTok,
            { expiresIn: duration }
        );

        res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: duration * 1000 // duration in miliseconds
        });

        res.status(201).json({
            message: 'Register successful',
        });
    } catch (err) {
        errorHandler(err, req, res, next);
    }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {

}