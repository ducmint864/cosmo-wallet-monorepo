import { Router } from "express";
import { registerNode } from "../controllers/http-nodes";
import { requireAccessToken } from "../../../auth-module/middlewares/user-auth";
import { requireUserTypeAdmin } from "../../../admin/middlewares/admin-privilege";
import { requireCsrfToken } from "../../../security/middlewares/csrf";


const httpNodesRouter = Router();

// Path param : nodeTYpe is either 'comet' or 'application'
httpNodesRouter.route("/:nodeType/register-node/").post(
	requireAccessToken,
	requireUserTypeAdmin,
	requireCsrfToken,
	registerNode
);

// httpNodesRouter.use("/health", (req, res) => res.send("I'm alive"));

export {
	httpNodesRouter,
}