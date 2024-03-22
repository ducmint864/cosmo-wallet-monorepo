import jwt from 'jsonwebtoken';
import createError from 'http-errors';
import 'dotenv/config';

export interface baseAccountPayload {
    username: string,
    email: string,
}

export function genToken(payload: baseAccountPayload, secret: string, duration: string): string {
    const options = {
        expiresIn: duration
    }
    const token = jwt.sign(payload, secret, options);
    return token;
}

export function decodeAndVerifyToken(token: string, secret: string): baseAccountPayload | Error{
    try {
        const decoded = jwt.verify(token, secret);
        return <baseAccountPayload>(decoded);
    } catch (err) {
        return err;
    }
}