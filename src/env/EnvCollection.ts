import "dotenv/config";

export class EnvCollection {
	// Singleton instance
	protected static _instance: EnvCollection;

	private constructor() {
		// Aggregate environment variables
		this.ACCESS_TOKEN_PRIVATE_KEY = process.env.ACCESS_TOKEN_PRIVATE_KEY;
		this.ACCESS_TOKEN_PUBLIC_KEY = process.env.ACCESS_TOKEN_PUBLIC_KEY;
		this.REFRESH_TOKEN_PRIVATE_KEY = process.env.REFRESH_TOKEN_PRIVATE_KEY;
		this.REFRESH_TOKEN_PUBLIC_KEY = process.env.REFRESH_TOKEN_PUBLIC_KEY;
		this.CSRF_TOKEN_SECRET = process.env.CSRF_TOKEN_SECRET;
		this.COMET_BFT_ENDPOINTS = process.env.COMET_BFT_ENDPOINTS?.split(",").map(values => values.trim());
		this.RPC_ENDPOINTS = process.env.RPC_ENDPOINTS?.split(",").map(value => value.trim());
		this.WEB_SOCKET_ENDPOINTS = process.env.WEB_SOCKET_ENDPOINTS?.split(",").map(value => value.trim());

		this.checkEnvironmentVariables();
	}

	protected checkEnvironmentVariables(): void {
		const toSpecify: string[] = [];
		let isFulfilled: boolean = true;
		for (const property in this) {
			const value = this[property];
			const isUndefined: boolean = (typeof value === "undefined");
			if (isUndefined) {
				isFulfilled = false;
				toSpecify.push(property);
			}
		}
		
		if (!isFulfilled) {
			console.error("Please fulfill these environment variables before starting web server:");
			for (const property of toSpecify) {
				console.error(`  - ${property}`);
			}
			process.exit(1);			
		}
	}

	public static get instance(): EnvCollection {
		if (!EnvCollection._instance) {
			EnvCollection._instance = new EnvCollection();
		}

		return EnvCollection._instance;
	}

	public readonly ACCESS_TOKEN_PRIVATE_KEY: string;
	public readonly ACCESS_TOKEN_PUBLIC_KEY: string;
	public readonly REFRESH_TOKEN_PRIVATE_KEY: string;
	public readonly REFRESH_TOKEN_PUBLIC_KEY: string;
	public readonly CSRF_TOKEN_SECRET: string;
	public readonly COMET_BFT_ENDPOINTS: string[];
	public readonly RPC_ENDPOINTS: string[];
	public readonly WEB_SOCKET_ENDPOINTS: string[];
}