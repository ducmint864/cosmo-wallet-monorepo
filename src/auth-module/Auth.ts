import { ProtocolError } from "thasa-wallet-interface";
import { ProtocolResponse } from "thasa-wallet-interface";
import { requestHelpers } from "../helpers";
import { walletServerUrl } from "../config";
import { join } from "path";


const RequestMethod = requestHelpers.RequestMethod;

/**
 * Authentication class providing methods for registering, logging in, logging out, and getting access tokens.
 */
export class Auth {
	/**
	* The base URL for authentication requests.
	*/
	public static baseUrl: string = walletServerUrl.modules.auth.moduleUrl;

	/**
	 * Registers a new user with the provided email, username, and password.
	 *
	 * @param email - The user's email address.
	 * @param username - The user's chosen username.
	 * @param password - The user's chosen password.
	 * @returns A `ProtocolResponse` object indicating the registration result.
	 * @throws A `ProtocolError` object if the registration fails.
	 *
	 * Example:
	 * ```
	 * const response = await Auth.register("user@example.com", "username", "password");
	 * console.log(response); // { _httpStatus: 200, _statusText: "OK", _data: { message: "Register successful" } }
	 * ```
	 * 
	 * More detailed examples at {@link https://github.com/ducmint864/ths-wallet-adapter}
	 */
	public static async register(email: string, username: string, password: string): Promise<ProtocolResponse> {
		if (!email || !username || !password) {
			throw new ProtocolError("Missing email or username or password", 400);
		}

		const url: string = join(this.baseUrl, "/register");

		const data = {
			"email": email,
			"username": username,
			"password": password
		};

		try {
			const protoResponse: ProtocolResponse = await requestHelpers.request(RequestMethod.POST, url, data);
			return protoResponse;
		} catch (protoErr) {
			throw protoErr;
		}
	}

	/**
	 * Logs in an existing user with the provided password and either email or username.
	 *
	 * @param password - The user's password.
	 * @param email - The user's email address (optional).
	 * @param username - The user's username (optional).
	 * @notice Although email and username are both optional, user must provide at least one of them
	 * @returns A `ProtocolResponse` object indicating the login result.
	 * @throws A `ProtocolError` object if the login fails.
	 *
	 * Example:
	 * ```
	 * const response = await Auth.login("password", "user@example.com");
	 * console.log(response); // { _httpStatus: 200, _statusText: "OK", data: { message: "Login successful" } }
	 * ```
	 * or
	 * ```
	 * const response = await Auth.login("password", undefined, "username");
	 * console.log(response); // { _httpStatus: 200, _statusText: "OK", data: { message: "Login successful" } }
	 * ```
	 * 
	 * More detailed examples at {@link https://github.com/ducmint864/ths-wallet-adapter}
	 */
	public static async login(password: string, email?: string, username?: string): Promise<ProtocolResponse> {
		let hasEmail: boolean, hasUsername: boolean;
		if (email) {
			hasEmail = true;
		} else if (username) {
			hasUsername = true;
		}

		if (!hasEmail && !hasUsername) {
			throw new ProtocolError("Missing email or username", 400);
		}

		const url: string = join(this.baseUrl, "/login");

		const data = hasEmail ? {
			"email": email,
			"password": password
		} : {
			"username": username,
			"password": password
		};

		try {
			const protoResponse: ProtocolResponse = await requestHelpers.request(RequestMethod.POST, url, data);
			return protoResponse;
		} catch (protoErr) {
			throw protoErr;
		}
	}


	/**
	 * Logs out the current user.
	 *
	 * @returns A `ProtocolResponse` object indicating the logout result.
	 * @throws A `ProtocolError` object if the logout fails.
	 *
	 * Example:
	 * ```
	 * const response = await Auth.logout();
	 * console.log(response); // { _httpStatus: 200, _statusText: "OK", data: { message: "Logout successful" } }
	 * ```
	 * 
	 * More detailed examples at {@link https://github.com/ducmint864/ths-wallet-adapter}
	 */
	public static async logout(): Promise<ProtocolResponse> {
		const url: string = join(this.baseUrl, "/logout");
		try {
			const protoResponse: ProtocolResponse = await requestHelpers.request(RequestMethod.POST, url);
			return protoResponse;
		} catch (protoErr) {
			throw protoErr;
		}
	}

	/**
	 * Retrieves an access token for the current user.
	 *
	 * @notice User must have a valid refresh token in their browser's cookies (can be acquired via login)
	 * @returns A `ProtocolResponse` object containing the access token.
	 * @throws `ProtocolError` object if the token retrieval fails.
	 *
	 * Example:
	 * ```
	 * const response = await Auth.getAccessToken();
	 * console.log(response); // { _httpStatus: 200, _statusText: "OK", data: { message: "Access token granted" }
	 * ```
	 * 
	 * More detailed examples at {@link https://github.com/ducmint864/ths-wallet-adapter}
	 */
	public static async getAccessToken(): Promise<ProtocolResponse> {
		const url: string = join(this.baseUrl, "/get-access-token");
		try {
			const protoResponse: ProtocolResponse = await requestHelpers.request(RequestMethod.GET, url);
			return protoResponse;
		} catch (protoErr) {
			throw protoErr;
		}
	}
}
