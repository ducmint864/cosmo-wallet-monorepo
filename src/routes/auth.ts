import express from "express";
import { register, login } from "../controllers/auth";
import { userAuth } from "../middlewares/user-auth";

const authRouter = express.Router();

authRouter.route("/register").post(register);
authRouter.route("/login").post(login);
// authRouter.route('/update').put(adminAuth, update);

export default authRouter;