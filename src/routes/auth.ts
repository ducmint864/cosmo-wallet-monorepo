import express from 'express';
import { register, login, retrieveNewToken } from '../controllers/auth';

const authRouter = express.Router();

authRouter.route('/register').post(register);
authRouter.route('/login').post(login);
authRouter.route('/retrieveNewToken').get(retrieveNewToken);

export default authRouter;