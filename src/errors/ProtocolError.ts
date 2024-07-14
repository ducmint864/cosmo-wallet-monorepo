// Describe communcation error between parties: Thasa wallet front-end, back-end, and Thasa chain nodes

import { AxiosResponse, AxiosError, InternalAxiosRequestConfig, Axios, AxiosRequestTransformer } from "axios";

export class ProtocolError<T = unknown, D = any> extends AxiosError {
	private _customProps: object;
	private _isProtocolError: boolean;

	constructor(
		message: string,
		httpStatus?: number,
		errorCode?: string,
		config?: InternalAxiosRequestConfig<D>,
		request?: any,
		response?: AxiosResponse<T, D>,
		customProps?: object,
	) {
		super(message, errorCode, config, request, response);
		this.status = httpStatus
		this._customProps = customProps || {};
		this._isProtocolError = true;
	}

	public static fromError<T = unknown, D = any>(
		error: Error,
		errorCode?: string,
		config?: InternalAxiosRequestConfig<D>,
		request?: any,
		response?: AxiosResponse<T, D>,
		customProps?: Object
	): ProtocolError<T, D> {
		if (!(error instanceof Error)) {
			throw new Error("Object is not an instance of class Error");
		}
		return new ProtocolError(
			error.message,
			undefined,
			errorCode,
			config,
			request,
			response,
			customProps
		);
	}

	public static fromUnknownError<T = unknown, D = any>(
		error: Error,
		errorCode?: string,
		config?: InternalAxiosRequestConfig<D>,
		request?: any,
		response?: AxiosResponse<T, D>,
		customProps?: Object
	): ProtocolError<T, D> {
		try {
			return new ProtocolError(
				String(error),
				undefined,
				errorCode,
				config,
				request,
				response,
				customProps
			);
		} catch (initError) {
			throw initError;
		}
	}


	public static fromAxiosError(error: AxiosError, customProps?: object): ProtocolError {
		if (!error.isAxiosError) {
			throw new Error("Error is not an instance of AxiosError");
		}
		// To-be-extended later
		return new ProtocolError(
			error.message,
			error.status,
			error.code,
			error.config,
			error.request,
			error.response,
			customProps
		);
	}

	get httpStatus(): number | undefined {
		return this.status;
	}

	get errorCode(): string | undefined {
		return this.code || "";
	}

	get customProps(): object | undefined {
		return this._customProps;
	}

	get isProtocolError(): boolean {
		return this._isProtocolError;
	}
}
