function getErrorJSON(
	statusCode: number,
	errMsg: string,
	stackTrace: string | null | undefined
): Record<string, any> {
	return {
		status: statusCode,
		message: errMsg,
		stack: stackTrace || ""
	};
}

export {
	getErrorJSON,
}