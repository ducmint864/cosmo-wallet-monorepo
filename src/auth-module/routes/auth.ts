import express, { Router } from "express";
import { register, login, getAccessToken, createWalletAccount, logout } from "../controllers/auth";
import { requireAccessToken, requireRefreshToken } from "../middlewares/user-auth";
import { sanitizeInput } from "../../security/middlewares/xss";
import { sendCsrfToken } from "../../security/middlewares/csrf";

const authRouter: Router = express.Router();

authRouter.route("/register").post(sanitizeInput, register);
authRouter.route("/login").post(sanitizeInput, login);
authRouter.route("/get-access-token").post(requireRefreshToken, getAccessToken);
authRouter.route("/create-wallet-account").post(requireAccessToken,sanitizeInput, createWalletAccount);
authRouter.route("/logout").post(requireRefreshToken, logout);

export { authRouter };