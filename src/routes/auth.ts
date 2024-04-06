import express from 'express';
import { register, login, retrieveNewToken, deriveAccount } from '../controllers/auth';
import {userAuth} from "../middlewares/user-auth";

const authRouter = express.Router();

authRouter.route('/register').post(register);
authRouter.route('/login').post(login);
authRouter.route('/retrieveNewToken').get(userAuth, retrieveNewToken);
authRouter.route("/deriveAccount").post(userAuth, deriveAccount);

export default authRouter;