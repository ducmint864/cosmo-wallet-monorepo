enum WebSocketClientManagerErrorCode {
	ERR_INVALID_URL = 0,
	ERR_INVALID_ID = 1,
	ERR_CLIENT_NOT_FOUND = 2,
	ERR_MIN_CLIENTS_REACHED = 3,
	ERR_MAX_CLIENTS_REACHED = 4,
	ERR_UNKNOWN = 5,
}

class WebSocketClientManagerError extends Error {
	
	protected _code: WebSocketClientManagerErrorCode;

	public constructor(
		code: WebSocketClientManagerErrorCode,
		msg?: string
	) {
		super("WebSocketClientManager error: " + (msg ?? ""));

		if (!code) {
			code = WebSocketClientManagerErrorCode.ERR_UNKNOWN;
		}

		this._code = code;
	}


	public get code(): WebSocketClientManagerErrorCode {
		return this._code;
	}
}

export {
	WebSocketClientManagerError,
	WebSocketClientManagerErrorCode,
};