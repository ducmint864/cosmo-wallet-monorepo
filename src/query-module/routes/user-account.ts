import express, { Router } from "express";
import { requireAccessToken, requireRefreshToken } from "../../auth-module/middlewares/user-auth";
import { getMyUserAccountInfo } from "../controllers/user-account";
import { sanitizeInput } from "../../security/middlewares/xss";

const userAccountQueryRouter: Router = express.Router();

userAccountQueryRouter.route("/my-account").get(requireAccessToken, sanitizeInput, getMyUserAccountInfo);

export { userAccountQueryRouter };