// Error codes
enum ChainNodeManagerErrorCode {
	ERR_ALREADY_REGISTERED = 1,
	ERR_NOT_REGISTERED = 2,
	ERR_INVALID_URL = 3,
	ERR_MIN_NODES_REACHED = 4,
	ERR_MAX_NODES_REACHED = 5,
	ERR_UNKNOWN = 6,
}

class ChainNodeManagerError extends Error {

	protected readonly _code: number;

	public constructor(
		code: ChainNodeManagerErrorCode,
		msg?: string
	) {
		if (!code) {
			code = ChainNodeManagerErrorCode.ERR_UNKNOWN;
		}
		super("ChainNodeManager error: " + (msg ?? ""));
		this._code = code;
	}

	public get code(): number {
		return this._code;
	}
}

export {
	ChainNodeManagerError,
	ChainNodeManagerErrorCode,
};