import express, { Router } from "express";
import { bankRouter } from "./bank";

const transactionRouter: Router = express.Router();
transactionRouter.use("/bank", bankRouter);

export { transactionRouter };