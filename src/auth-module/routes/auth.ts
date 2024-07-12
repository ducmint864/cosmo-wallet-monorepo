import express, { Router } from "express";
import { register, login, refreshAccessToken, createWalletAccount, logOut } from "../controllers/auth";
import { requireAccessToken, requireRefreshToken } from "../middlewares/user-auth";

const authRouter: Router = express.Router();

authRouter.route("/register").post(register);
authRouter.route("/login").post(login);
authRouter.route("/retrieveNewToken").post(requireRefreshToken, refreshAccessToken);
authRouter.route("/deriveAccount").post(requireAccessToken, createWalletAccount);
authRouter.route("/logOut").post(requireRefreshToken, logOut);

export { authRouter };