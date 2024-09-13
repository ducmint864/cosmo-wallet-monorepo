import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { ProtocolResponse, ProtocolError } from "thasa-wallet-interface";
import https from "https";


const baseUrl: string = process.env.WEB_SERVER_URL || "https://localhost:3000";
const axiosInstance: AxiosInstance = axios.create({
	baseURL: baseUrl,
	withCredentials: true,
	httpsAgent: new https.Agent({
		rejectUnauthorized: false, // Development only (Change this in production)
	}),
});

enum RequestMethod {
	GET,
	POST,
	PATCH,
	PUT,
	DELETE,
	OPTIONS,
};

/**
 * 
 * @param url 
 * @param data
 * @returns ProtocolResponse if request succeeds
 * @throws ProtocolError if request fails
 */
async function request(method: RequestMethod, url: string, data?: object, requestConfig?: object): Promise<ProtocolResponse> {
	if (!url) {
		throw new ProtocolError("Invalid request URL", 400);
	}

	try {
		let response: AxiosResponse;
		switch (method) {
			case RequestMethod.GET:
				response = await axiosInstance.get(url, requestConfig);
				break;
			case RequestMethod.POST:
				response = await axiosInstance.post(url, data, requestConfig);
				break;
			case RequestMethod.PATCH:
				response = await axiosInstance.patch(url, data, requestConfig);
				break;
			case RequestMethod.PUT:
				response = await axiosInstance.put(url, data, requestConfig);
				break;
			case RequestMethod.DELETE:
				response = await axiosInstance.delete(url, requestConfig);
				break;
			case RequestMethod.OPTIONS:
				response = await axiosInstance.options(url, requestConfig);
				break;
			default:
				throw new ProtocolError(`Unsupported request method: ${method}`, 501);
		}
		return ProtocolResponse.fromAxiosResponse(response);	
	} catch (err) {
		if (err instanceof AxiosError) {
			throw ProtocolError.fromAxiosError(err);
		} else {
			throw ProtocolError.fromError(err);
		} 
	}
}


export { request, RequestMethod }