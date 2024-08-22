import { Request, Response, NextFunction } from "express";
import { getStringFromRequestBody } from "../../../general/helpers/request-parser";
import { blockchainApiNodeMan, cometHttpNodeMan } from "../../index";
import { HttpNodeManagerError, HttpNodeManagerErrorCode } from "../../chain-rpc/http/types/HttpNodeManagerError";
import { errorHandler } from "../../../errors/middlewares/error-handler";
import { NodeTypeEnum } from "../../chain-rpc/http/types/NodeTypeEnum";
import createHttpError from "http-errors";

async function registerNode(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	// Register new entry in the node Manager
	const url: string = getStringFromRequestBody(req, "url");
	const nodeType: string = req.params["nodeType"] ?? "";

	try {
		if (!url) {
			throw createHttpError(400, "invalid URL");
		}
		if (!nodeType) {
			throw createHttpError(400, "please specify request type");
		}

		switch (nodeType) {
			case NodeTypeEnum.comet:
				await cometHttpNodeMan.registerNode(url);
				break;
			case NodeTypeEnum.application:
				await blockchainApiNodeMan.registerNode(url);
				break;
			default:
				throw createHttpError(400, `invalid node type ${nodeType} (choose either 'comet' or 'application'`);
		}

		// Successful
		res.status(201).json({
			message: "Node registered",
		});
	} catch (err) {
		if (err instanceof HttpNodeManagerError) {
			switch (err.code) {
				case HttpNodeManagerErrorCode.ERR_ALREADY_REGISTERED:
					err = createHttpError(419, "already registered");
					break;
				case HttpNodeManagerErrorCode.ERR_MAX_NODES_REACHED:
					err = createHttpError(400, "maximum number of nodes reached");
					break;
			}
		}
		errorHandler(err, req, res, next);
	}
}

async function removeNode(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	const url: string = getStringFromRequestBody(req, "url");
	const nodeType: string = req.params["nodeType"] ?? "";

	try {
		if (!url) {
			throw createHttpError(400, "invalid URL");
		}
		if (!nodeType) {
			throw createHttpError(400, "please specify request type");
		}

		switch (nodeType) {
			case NodeTypeEnum.comet:
				await cometHttpNodeMan.removeNode(url);
				break;
			case NodeTypeEnum.application:
				await blockchainApiNodeMan.removeNode(url);
				break;
			default:
				throw createHttpError(400, `invalid node type ${nodeType} (choose either 'comet' or 'application'`);
		}

		// Successful
		res.status(201).json({
			message: "Node registered",
		});
	} catch (err) {
		if (err instanceof HttpNodeManagerError) {
			switch (err.code) {
				case HttpNodeManagerErrorCode.ERR_MIN_NODES_REACHED:
					err = createHttpError(400, "minimum number of nodes reached");
					break;
			}
		}
		errorHandler(err, req, res, next);
	}
}

export {
	registerNode,
}