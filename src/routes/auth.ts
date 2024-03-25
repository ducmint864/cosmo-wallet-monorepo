<<<<<<< HEAD
import express from 'express';
import { register, login, retrieveNewToken } from '../controllers/auth';

const authRouter = express.Router();

authRouter.route('/register').post(register);
authRouter.route('/login').post(login);
authRouter.route('/retrieveNewToken').get(retrieveNewToken);
=======
import express from "express";
import { register, login } from "../controllers/auth";
import { userAuth } from "../middlewares/user-auth";

const authRouter = express.Router();

authRouter.route("/register").post(register);
authRouter.route("/login").post(login);
// authRouter.route('/update').put(adminAuth, update);
>>>>>>> main

export default authRouter;