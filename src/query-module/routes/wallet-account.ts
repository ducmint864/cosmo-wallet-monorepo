import express, { Router } from "express";
import { requireAccessToken } from "../../auth-module/middlewares/user-auth";
import { getMyWalletAccountInfo  } from "../controllers/wallet-account";

const walletAccountQueryRouter: Router = express.Router();

walletAccountQueryRouter.route("/my-wallet").get(requireAccessToken, getMyWalletAccountInfo );

export { walletAccountQueryRouter };