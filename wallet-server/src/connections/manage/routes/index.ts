import { Router } from "express";
import { httpNodesRouter } from "./http-nodes";

const manageRouter = Router();

manageRouter.use("/http", httpNodesRouter);
manageRouter.use("/health", (req, res) => res.send("I'm alive"));

export {
	manageRouter,
}