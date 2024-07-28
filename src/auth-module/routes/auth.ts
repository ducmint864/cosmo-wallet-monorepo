import express, { Router } from "express";
import { register, login, refreshSession, createWalletAccount, logout } from "../controllers/auth";
import { requireAccessToken, requireRefreshToken } from "../middlewares/user-auth";
import { sanitizeInput } from "../../security/middlewares/xss";
import { requireCsrfToken } from "../../security/middlewares/csrf";

const authRouter: Router = express.Router();

authRouter.route("/register").post(sanitizeInput, register);
authRouter.route("/login").post(sanitizeInput, login);
authRouter.route("/refresh-session").post(requireRefreshToken, refreshSession);
authRouter.route("/create-wallet-account").post(requireAccessToken, requireCsrfToken, sanitizeInput, createWalletAccount);
authRouter.route("/logout").post(requireAccessToken, requireCsrfToken, logout);

export { authRouter };