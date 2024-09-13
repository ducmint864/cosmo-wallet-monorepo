import { join } from "path";

const topLevelUrl = "/api";

export const walletServerUrl = {
	topLevelUrl,
	modules: {
		auth: {
			moduleUrl: join(topLevelUrl, "/auth")
		},
		query: {
			moduleUrl: join(topLevelUrl, "/query")
		},
		transaction: {
			moduleUrl: join(topLevelUrl, "/transaction")
		}
	}
}