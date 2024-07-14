import {
	AxiosResponse,
	RawAxiosResponseHeaders,
	AxiosResponseHeaders,
	RawAxiosRequestConfig,
	InternalAxiosRequestConfig
} from "axios";

/**
 * @dev This class implicitly implements the AxiosResponse interface
 */
export class ProtocolResponse<T = any, D = any> {
	private _data: T;
	public _httpStatus: number;
	public _statusText: string;
	public _headers: RawAxiosResponseHeaders | AxiosResponseHeaders;
	public _config: InternalAxiosRequestConfig<D>;
	public _request?: any;

	constructor(
		data: T,
		httpStatus: number,
		statusText: string,
		headers: RawAxiosResponseHeaders | AxiosResponseHeaders,
		requestConfig: InternalAxiosRequestConfig<D>,
		request?: any
	) {
		this._data = data 
		this._httpStatus = httpStatus;
		this._statusText = statusText;
		this._headers = headers;
		this._config = requestConfig;
		this._request = request;
	}

	public static fromAxiosResponse(response: AxiosResponse) {
		return new ProtocolResponse(
			response.data,
			response.status,
			response.statusText,
			response.headers,
			response.config,
			response.request
		);
	}

	get data(): T {
		return this._data;
	}

	get httpStatus(): number {
		return this._httpStatus;
	}	

	get statusText(): string {
		return this._statusText;
	}

	get responseHeaders(): RawAxiosResponseHeaders | AxiosResponseHeaders {
		return this._headers;
	}

	get requestConfig(): InternalAxiosRequestConfig<D> {
		return this._config;
	}

	get request(): any {
		return this._request;
	}
}