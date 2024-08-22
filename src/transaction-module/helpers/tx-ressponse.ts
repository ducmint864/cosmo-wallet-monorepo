import { Coin } from "thasa-wallet-interface";
import { parseCoins } from "@cosmjs/proto-signing";
import { DeliverTxResponse } from "@cosmjs/stargate";

/**
 * Extracts the fees from a transaction response.
 *
 * @param txResponse - The transaction response to extract fees from.
 * @returns An array of Coin objects representing the fees.
 *
 * @example
 * const txResponse: DeliverTxResponse = {
 *   events: [
 *     {
 *       attributes: [
 *         { key: "fee", value: "100uatom" },
 *       ],
 *     },
 *   ],
 * };
 * const fees = getFeesFromTxResponse(txResponse);
 * console.log(fees); // Output: [{ denom: "uatom", amount: "100" }]
 */
function getFeesFromTxResponse(txResponse: DeliverTxResponse): Coin[] {
	for (const event of txResponse.events) {
		for (const attribute of event.attributes) {
			if (attribute.key === "fee") {
				return parseCoins(attribute.value);
			}
		}
	}
}

export {
	getFeesFromTxResponse,
}