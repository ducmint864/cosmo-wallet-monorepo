/**
 * Enum for WebSocketClientManager error codes.
 */
enum CometWsManagerErrorCode {
	ERR_ADD_CLIENT_FAILED = 0,
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

	/**
	 * 
	 */
	ERR_CONNECTION_FAILED = 6,
}

/**
 * Custom error class for WebSocketClientManager.
 */
class CometWsManagerError extends Error {
	/**
	 * Error code.
	 */
	protected _code: CometWsManagerErrorCode;

	/**
	 * Constructor for WebSocketClientManagerError.
	 * @param {CometWsManagerErrorCode} code - Error code.
	 * @param {string} [msg] - Optional error message.
	 * @example
	 * const error = new WebSocketClientManagerError(WebSocketClientManagerErrorCode.ERR_INVALID_URL, 'Invalid URL provided');
	 */
	public constructor(
		code: CometWsManagerErrorCode,
		msg?: string
	) {
		super("WebSocketClientManager error: " + (msg ?? ""));

		if (!code) {
			code = CometWsManagerErrorCode.ERR_UNKNOWN;
		}

		this._code = code;
	}

	/**
	 * Getter for error code.
	 * @returns {CometWsManagerErrorCode} Error code.
	 * @example
	 * const error = new WebSocketClientManagerError(WebSocketClientManagerErrorCode.ERR_INVALID_URL);
	 * console.log(error.code); // Output: 0
	 */
	public get code(): CometWsManagerErrorCode {
		return this._code;
	}
}

export {
	CometWsManagerError,
	CometWsManagerErrorCode,
};