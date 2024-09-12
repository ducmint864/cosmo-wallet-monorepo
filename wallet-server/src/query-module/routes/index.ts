import { userAccountQueryRouter } from "./user-account";
import { walletAccountQueryRouter } from "./wallet-account";
import { Router } from "express";

const queryRouter = Router();

// Aggregates all routers in the current module and export a combined router
queryRouter.use("/user-account", userAccountQueryRouter);
queryRouter.use("/wallet-account", walletAccountQueryRouter);

export { queryRouter };