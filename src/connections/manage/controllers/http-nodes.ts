import { Request, Response, NextFunction } from "express";
import { getStringFromRequestBody } from "../../../general/helpers/request-parser";
import { cometHttpNodeMan } from "../../index";
import { HttpNodeManagerError, HttpNodeManagerErrorCode } from "../../chain-rpc/http/types/HttpNodeManagerError";
import { errorHandler } from "../../../errors/middlewares/error-handler";
import createHttpError from "http-errors";

async function registerNode(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	// Register new entry in the node Manager
	const url: string = getStringFromRequestBody(req, "url");
	const nodeType: string = req.params["nodetype"] ?? "";

	try {
		if (!url) {
			throw createHttpError(400, "registerNode(): invalid URL");
		}
		if (!nodeType) {
			throw createHttpError(400, "registerNode(): please specify request type");
		}

		if (nodeType !== "comet" && nodeType !== "application") {
			throw createHttpError(400, "registerNode(): invalid node type (choose either 'comet' or 'application'");
		}
		await cometHttpNodeMan.registerNode(url);

		// Successful
		res.status(201).json({
			message: "Node registered",
		});
	} catch (err) {
		if (err instanceof HttpNodeManagerError) {
			switch (err.code) {
				case HttpNodeManagerErrorCode.ERR_ALREADY_REGISTERED:
					err = createHttpError(419, "registerNode(): already registered");
					break;
				case HttpNodeManagerErrorCode.ERR_MAX_NODES_REACHED:
					err = createHttpError(400, "registeredNode(): maximum number of nodes reached");
					break;
				case HttpNodeManagerErrorCode.ERR_MIN_NODES_REACHED:
					err = createHttpError(400, "registerNode(): minimum number of nodes reached");
					break;
			}
		}
		errorHandler(err, req, res, next);
	}
}

export {
	registerNode,
}