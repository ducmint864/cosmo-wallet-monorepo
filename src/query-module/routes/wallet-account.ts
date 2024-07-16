import express, { Router } from "express";
import { requireAccessToken } from "../../auth-module/middlewares/user-auth";
import { getWalletAccountInfo } from "../controllers/wallet-account";

const walletAccountQueryRouter: Router = express.Router();

walletAccountQueryRouter.route("/info").get(requireAccessToken, getWalletAccountInfo );

export { walletAccountQueryRouter };