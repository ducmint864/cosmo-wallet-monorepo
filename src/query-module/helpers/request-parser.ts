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
		.map( (str: string) => parseInt(str.trim()) )
		.filter( (num: number) => !isNaN(num) );
}

function getNumberArrayQueryParam(req: Request, paramName: string): number[] {
	const value: string | string[] | unknown = req.query[paramName];

	if (typeof value === "string") {
		const stringArr: string[] = value.split(",");
		return toNumberArray(stringArr);
	}

	return toNumberArray(value);
}

export { getBooleanQueryParam, getNumberArrayQueryParam };