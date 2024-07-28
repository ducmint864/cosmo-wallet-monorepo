import express, { Router } from "express";
import { requireAccessToken } from "../../auth-module/middlewares/user-auth";
import { getMyWalletAccountInfo, findWithAddress } from "../controllers/wallet-account";
import { sanitizeInput } from "../../security/middlewares/xss";
import { requireCsrfToken } from "../../security/middlewares/csrf";

const walletAccountQueryRouter: Router = express.Router();

walletAccountQueryRouter.route("/my-wallet").get(requireAccessToken, requireCsrfToken, sanitizeInput, getMyWalletAccountInfo );
walletAccountQueryRouter.route("/find").get(requireAccessToken, requireCsrfToken, sanitizeInput, findWithAddress);

export { walletAccountQueryRouter };