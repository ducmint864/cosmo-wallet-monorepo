import express, { Router } from "express";
import { requireAccessToken, requireRefreshToken } from "../../auth-module/middlewares/user-auth";
import { getMyUserAccountInfo } from "../controllers/user-account";

const userAccountQueryRouter: Router = express.Router();

userAccountQueryRouter.route("/my-account").get(requireAccessToken, getMyUserAccountInfo);

export { userAccountQueryRouter };