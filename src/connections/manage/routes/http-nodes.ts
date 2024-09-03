import { Router } from "express";
import { registerNode, removeNode } from "../controllers/http-nodes";
import { requireAccessToken } from "../../../auth-module/middlewares/user-auth";
import { requireAdminRole } from "../../../admin/middlewares/admin-privilege";
import { requireCsrfToken } from "../../../security/middlewares/csrf";

const httpNodesRouter = Router();

// Path param : nodeType is either 'comet' or 'application'
httpNodesRouter.route("/:nodeType/register-node/").post(
	requireAccessToken,
	requireAdminRole,
	requireCsrfToken,
	registerNode
);

httpNodesRouter.route("/:nodeType/remove-node").post(
	requireAccessToken,
	requireAdminRole,
	requireCsrfToken,
	removeNode
)

// httpNodesRouter.use("/health", (req, res) => res.send("I'm alive"));

export {
	httpNodesRouter,
}