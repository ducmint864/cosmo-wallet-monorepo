import express, { Router } from "express";
import { requireAccessToken, requireRefreshToken } from "../../auth-module/middlewares/user-auth";
import { getAccountInfo } from "../controllers/account-query";

const accountQueryRouter: Router = express.Router();

accountQueryRouter.route("/info").get(requireAccessToken, getAccountInfo);

export { accountQueryRouter };