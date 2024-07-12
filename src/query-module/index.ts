import express, { Router } from "express";
import { accountQueryRouter } from "./routes/account-query";

// Aggregates all routers in the current module and export a combined router
const queryRouter: Router = express.Router();

queryRouter.use("/account", accountQueryRouter);

export { queryRouter };