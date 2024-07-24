import express, { Router } from "express";
import { requireAccessToken } from "../../auth-module/middlewares/user-auth";
import { getMyWalletAccountInfo, findWithAddress } from "../controllers/wallet-account";
import { sanitizeInput } from "../../middlewares/inputs/sanitize-input";

const walletAccountQueryRouter: Router = express.Router();

walletAccountQueryRouter.route("/my-wallet").get(requireAccessToken, sanitizeInput, getMyWalletAccountInfo );
walletAccountQueryRouter.route("/find").get(requireAccessToken, sanitizeInput, findWithAddress);

export { walletAccountQueryRouter };