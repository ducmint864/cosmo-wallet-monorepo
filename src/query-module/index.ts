import express, { Router } from "express";
import { accountQueryRouter } from "./routes/user-account";

// Aggregates all routers in the current module and export a combined router
const queryRouter: Router = express.Router();

queryRouter.use("/user-account", accountQueryRouter);

export { queryRouter };