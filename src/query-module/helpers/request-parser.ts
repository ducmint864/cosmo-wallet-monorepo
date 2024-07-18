import { Request } from "express";

function getBooleanQueryParam(req: Request, paramName: string): boolean {
	const value = req.query[paramName];
	const isTrue: boolean = value && value.toString().toLowerCase() === "true";
	return isTrue;
}

function toNumberArray(value: string | string[] | unknown): number[] {
	if (Array.isArray(value)) {
		return value.map((v) => parseInt(v.trim()));
	}
	else if (typeof value === "string") {
		return value
			.toString()
			.split(",")
			.map(
				(v) => parseInt(v.trim())
			);
	}

	return new Array<number>();
}

function getNumberArrayQueryParam(req: Request, paramName: string): number[] {
	const value = req.query[paramName];
	return toNumberArray(value);
}

export { getBooleanQueryParam, getNumberArrayQueryParam };