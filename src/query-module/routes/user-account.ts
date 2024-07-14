import express, { Router } from "express";
import { requireAccessToken, requireRefreshToken } from "../../auth-module/middlewares/user-auth";
import { getAccountInfo } from "../controllers/user-account";

const userAccountQueryRouter: Router = express.Router();

userAccountQueryRouter.route("/info").get(requireAccessToken, getAccountInfo);

export { userAccountQueryRouter as accountQueryRouter };