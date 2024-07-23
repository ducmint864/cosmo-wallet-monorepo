/**
 * Enum for WebSocketClientManager error codes.
 */
enum WebSocketClientManagerErrorCode {
	/**
	 * Error code for invalid URL.
	 */
	ERR_INVALID_URL = 0,
	/**
	 * Error code for invalid client ID.
	 */
	ERR_INVALID_ID = 1,
	/**
	 * Error code for client not found.
	 */
	ERR_CLIENT_NOT_FOUND = 2,
	/**
	 * Error code for minimum number of clients reached.
	 */
	ERR_MIN_CLIENTS_REACHED = 3,
	/**
	 * Error code for maximum number of clients reached.
	 */
	ERR_MAX_CLIENTS_REACHED = 4,
	/**
	 * Error code for unknown error.
	 */
	ERR_UNKNOWN = 5,
}

/**
 * Custom error class for WebSocketClientManager.
 */
class WebSocketClientManagerError extends Error {
	/**
	 * Error code.
	 */
	protected _code: WebSocketClientManagerErrorCode;

	/**
	 * Constructor for WebSocketClientManagerError.
	 * @param {WebSocketClientManagerErrorCode} code - Error code.
	 * @param {string} [msg] - Optional error message.
	 * @example
	 * const error = new WebSocketClientManagerError(WebSocketClientManagerErrorCode.ERR_INVALID_URL, 'Invalid URL provided');
	 */
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

	/**
	 * Getter for error code.
	 * @returns {WebSocketClientManagerErrorCode} Error code.
	 * @example
	 * const error = new WebSocketClientManagerError(WebSocketClientManagerErrorCode.ERR_INVALID_URL);
	 * console.log(error.code); // Output: 0
	 */
	public get code(): WebSocketClientManagerErrorCode {
		return this._code;
	}
}

export {
	WebSocketClientManagerError,
	WebSocketClientManagerErrorCode,
};