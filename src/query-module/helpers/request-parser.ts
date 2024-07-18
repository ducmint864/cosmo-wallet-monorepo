import { Request } from "express";

function getBooleanQueryParam(req: Request, paramName: string): boolean {
	const value = req.query?.paramName;
	const isTruthy: boolean = value && value.toString().toLowerCase() === "true";
	return isTruthy;
}

export { getBooleanQueryParam };