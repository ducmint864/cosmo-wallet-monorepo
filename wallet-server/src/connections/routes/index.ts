import { Router } from "express";
import { manageRouter } from "../manage/routes";

// Define module-level router for connections module
const connectionsRouter = Router();
connectionsRouter.use("/manage", manageRouter);
connectionsRouter.use("/health", (req, res, next) => res.send("Im alive"));

export {
	connectionsRouter,
};