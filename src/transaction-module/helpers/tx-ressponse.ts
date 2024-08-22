import { Coin } from "thasa-wallet-interface";
import { parseCoins } from "@cosmjs/proto-signing";
import { DeliverTxResponse } from "@cosmjs/stargate";

function getFeesFromTxResponse(txResponse: DeliverTxResponse): Coin[] {
	for (const event of txResponse.events) {
		for (const attribute of event.attributes) {
			if (attribute.key === "fee") {
				return parseCoins(attribute.value)
			}
		}
	}
}

export {
	getFeesFromTxResponse,
}