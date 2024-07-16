import express, { Router } from "express";
import { requireAccessToken, requireRefreshToken } from "../../auth-module/middlewares/user-auth";
import { getUserAccountInfo } from "../controllers/user-account";

const userAccountQueryRouter: Router = express.Router();

userAccountQueryRouter.route("/info").get(requireAccessToken, getUserAccountInfo);

export { userAccountQueryRouter };