import express, { Router } from "express";
import { requireAccessToken, requireRefreshToken } from "../../auth-module/middlewares/user-auth";
import { getMyUserAccountInfo } from "../controllers/user-account";
import { sanitizeInput } from "../../security/middlewares/xss";
import { requireCsrfToken } from "../../security/middlewares/csrf";

const userAccountQueryRouter: Router = express.Router();

userAccountQueryRouter.route("/my-account").get(requireAccessToken, requireCsrfToken, sanitizeInput, getMyUserAccountInfo);

export { userAccountQueryRouter };