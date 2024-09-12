import express, { Router } from "express";
import { requireAccessToken } from "../../auth-module/middlewares/user-auth";
import { sendCoin } from "../controllers/bank";
import { sanitizeInput } from "../../security/middlewares/xss";
import { requireCsrfToken } from "../../security/middlewares/csrf";

const bankRouter: Router = express.Router();
bankRouter.route("/send-coin").post(requireAccessToken, requireCsrfToken, sanitizeInput, sendCoin);

export { bankRouter };