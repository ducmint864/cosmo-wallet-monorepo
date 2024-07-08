import express from "express";
import { register, login, retrieveNewToken, deriveAccount, logOut } from "../controllers/auth";
import { requireAccessToken, requireRefreshToken } from "../middlewares/user-auth";

const authRouter = express.Router();

authRouter.route("/register").post(register);
authRouter.route("/login").post(login);
authRouter.route("/retrieveNewToken").post(requireRefreshToken, retrieveNewToken);
authRouter.route("/deriveAccount").post(requireAccessToken, deriveAccount);
authRouter.route("/logOut").post(requireRefreshToken, logOut);

export default authRouter;