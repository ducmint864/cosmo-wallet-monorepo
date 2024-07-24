import express, { Router } from "express";
import { requireAccessToken } from "../../auth-module/middlewares/user-auth";
import { sendCoin } from "../controllers/bank";
import { sanitizeInput } from "../../middlewares/inputs/sanitize-input";

const bankRouter: Router = express.Router();
bankRouter.route("/send-coin").post(requireAccessToken, sanitizeInput, sendCoin);

export { bankRouter };