import express, { Router } from "express";
import { register, login, refreshAccessToken, createWalletAccount, logOut } from "../controllers/auth";
import { requireAccessToken, requireRefreshToken } from "../middlewares/user-auth";

const authRouter: Router = express.Router();

authRouter.route("/register").post(register);
authRouter.route("/login").post(login);
authRouter.route("/get-access-token").post(requireRefreshToken, refreshAccessToken);
authRouter.route("/create-wallet-account").post(requireAccessToken, createWalletAccount);
authRouter.route("/logout").post(requireRefreshToken, logOut);

export { authRouter };