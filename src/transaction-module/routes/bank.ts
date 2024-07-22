import express, { Router } from "express";
import { requireAccessToken } from "../../auth-module/middlewares/user-auth";
import { sendCoin } from "../controllers/bank";

const bankRouter: Router = express.Router();
bankRouter.route("/send-coin").post(requireAccessToken, sendCoin);

export { bankRouter };