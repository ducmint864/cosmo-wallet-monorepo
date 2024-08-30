import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError } from "@prisma/client/runtime/library";
import { prisma } from "../../connections";
import { Request, Response } from "express";
import { getErrorJSON } from "../helpers/error-message";

function onUniqueConstraintError(err: PrismaClientKnownRequestError, res: Response): Response {
	const conflictHttpCode = 409;
	const uniqueFields = <string[]>err?.meta?.target || []

	if (uniqueFields.length < 1) {
		return res.status(conflictHttpCode)
			.json(getErrorJSON(conflictHttpCode, "Unknown resource conflict", err.stack));
	}

	switch (uniqueFields[0]) {
		case prisma.user_accounts.fields.email.name:
			return res.status(conflictHttpCode)
				.json(getErrorJSON(conflictHttpCode, "Email has been taken", err.stack));
		case prisma.user_accounts.fields.username.name:
			return res.status(conflictHttpCode)
				.json(getErrorJSON(conflictHttpCode, "Username has been taken", err.stack));
		default:
			return res.status(conflictHttpCode)
				.json(getErrorJSON(conflictHttpCode, "Resource is already used", err.stack));
	}
}

function handlePrismaClientError(
	err: PrismaClientKnownRequestError | PrismaClientUnknownRequestError,
	res: Response,
): Response {
	const defaultHttpCode = 500

	if (err instanceof PrismaClientUnknownRequestError) {
		res.status(defaultHttpCode).json(getErrorJSON(defaultHttpCode, "unknown storage error", err.stack))
	}

	const knownErr = (err as PrismaClientKnownRequestError)
	switch (knownErr.code) {
		case "P2002":
			return onUniqueConstraintError(knownErr, res);
		default:
			return res.status(defaultHttpCode)
				.json(getErrorJSON(defaultHttpCode, "storage error", err.stack));
	}
}

export {
	handlePrismaClientError,
}
