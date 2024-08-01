/**
 * Enum for error codes in HttpNodeManagerError
 */
enum HttpNodeManagerErrorCode {
	/**
	 * Error code for when a node is already registered
	 */
	ERR_ALREADY_REGISTERED = 1,
	/**
	 * Error code for when a node is not registered
	 */
	ERR_NOT_REGISTERED = 2,
	/**
	 * Error code for when an invalid URL is provided
	 */
	ERR_INVALID_URL = 3,
	/**
	 * Error code for when the minimum number of nodes is reached
	 */
	ERR_MIN_NODES_REACHED = 4,
	/**
	 * Error code for when the maximum number of nodes is reached
	 */
	ERR_MAX_NODES_REACHED = 5,
	/**
	 * Error code for unknown errors
	 */
	ERR_UNKNOWN = 6,
}

/**
 * Custom error class for HttpNodeManager
 */
class HttpNodeManagerError extends Error {
	/**
	 * The error code for this error
	 */
	protected readonly _code: number;

	/**
	 * Creates a new Http instance
	 * @param {HttpNodeManagerErrorCode} code The error code for this error
	 * @param {string} [msg] An optional error message
	 * @example
	 * const error = new HttpNodeManagerError(HttpNodeManagerErrorCode.ERR_ALREADY_REGISTERED, 'Node is already registered');
	 */
	public constructor(
		code: HttpNodeManagerErrorCode,
		msg?: string
	) {
		if (!code) {
			code = HttpNodeManagerErrorCode.ERR_UNKNOWN;
		}
		super("HttpNodeManager error: " + (msg ?? ""));
		this._code = code;
	}

	/**
	 * Gets the error code for this error
	 * @returns {number} The error code
	 * @example
	 * const error = new HttpNodeManagerError(HttpNodeManagerErrorCode.ERR_ALREADY_REGISTERED);
	 * console.log(error.code); // 1
	 */
	public get code(): number {
		return this._code;
	}
}

export {
	HttpNodeManagerError,
	HttpNodeManagerErrorCode,
};