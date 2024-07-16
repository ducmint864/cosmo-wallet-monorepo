import express, { Router } from "express";
import { userAccountQueryRouter } from "./routes/user-account";
import { walletAccountQueryRouter } from "./routes/wallet-account";

const queryRouter: Router = express.Router();

// Aggregates all routers in the current module and export a combined router
queryRouter.use("/user-account", userAccountQueryRouter);
queryRouter.use("/wallet-account", walletAccountQueryRouter);

export { queryRouter };