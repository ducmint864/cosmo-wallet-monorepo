import 'dotenv/config';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET;

const adminAuth = async (req: Request, res: Response, next: any): Promise<any> => {
    console.log(req.cookies)
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, jwtSecret, (err: any, decodedToken: any) => {
            if (err) {
                return res.status(401).json({
                    message: 'jwt unauthorized'
                })
            } else if (decodedToken.user_info.role !== 'Admin') {
                return res.status(401).json({
                    message: 'jwt unauthorized'
                })
            }

            next();
        })
    } else {
        return res.status(401).json({
            message: 'jwt not provided'
        })
    }
}

export default adminAuth;