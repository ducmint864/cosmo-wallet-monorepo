import 'dotenv/config';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET;

export const userAuth = async (req: Request, res: Response, next: any): Promise<any> => {
    const token = req.cookies.jwt;
    if (token) {

        jwt.verify(token, jwtSecret, (err: any, decodedToken: any) => {
            if (err) {
                return res.status(401).json({
                    message: 'Unauthorized jwt'
                })
            } else {
                if (decodedToken.user_info.role !== 'Basic') {
                    return res.status(401).json({
                        message: 'Unauthorized jwt'
                    })
                }

                next();
            }
        });
    } else {
        return res.status(401).json({
            message: 'jwt not provided'
        })
    }
}

export default userAuth;