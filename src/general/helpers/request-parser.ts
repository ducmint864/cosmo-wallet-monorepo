import { Request } from "express";

function getBooleanQueryParam(req: Request, paramName: string): boolean {
	const value = req.query[paramName];
	const isTrue: boolean = value && value.toString().toLowerCase() === "true";
	return isTrue;
}

function toNumberArray(stringArr: string[] | unknown): number[] {
	if (!Array.isArray(stringArr)) {
		return new Array<number>();
	}

	return stringArr
		.map((str: string) => parseInt(str.trim()))
		.filter((num: number) => !isNaN(num));
}

function getNumberArrayQueryParam(req: Request, paramName: string): number[] {
	const value: string | string[] | unknown = req.query[paramName];

	if (typeof value === "string") {
		const stringArr: string[] = value.split(",");
		return toNumberArray(stringArr);
	}

	return toNumberArray(value);
}

function getStringFromRequestBody(req: Request, key: string): string {
	const value: unknown = req.body[key];
	if (typeof value === "string") {
		return value;
	}

	return value?.toString() ?? "";
}

function getObjectFromRequestBody(req: Request, key: string): object {
	const value: unknown = req.body[key];
	if (typeof value === "object") {
		return value;
	} else if (typeof value === "string") {
		try {
			return JSON.parse(value);
		} catch (err) {
			return {};
		}
	}
	return {};
}

function getStringsFromRequestBody(req: Request, ...keys: string[]): { [key: string]: string } {
	const result: { [key: string]: string } = {};
	keys.forEach((key) => {
		result[key] = getStringFromRequestBody(req, key);
	});
	return result;
}

function getObjectsFromRequestBody(req: Request, ...keys: string[]): { [key: string]: object} {
	const result: { [key: string]: object } = {};
	keys.forEach((key) => {
		result[key] = getObjectFromRequestBody(req, key);
	})
	return result;
}

export {
	getBooleanQueryParam,
	getNumberArrayQueryParam,
	getStringFromRequestBody,
	getObjectFromRequestBody,
	getStringsFromRequestBody,
	getObjectsFromRequestBody,
};