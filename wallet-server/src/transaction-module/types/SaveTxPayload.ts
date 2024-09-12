import { DeliverTxResponse } from "@cosmjs/stargate"
import { tx_status_enum } from "@prisma/client"
import { pick } from "lodash"

/**
 * Payload for a pending transaction.
 * 
 * @property {DeliverTxResponse} **txResponse** - The response from the transaction.
 * @property {tx_status_enum} **txStatus** - The status of the transaction.
 * @property {string} **fromAddress** - The address that initiated the transaction.
 * @property {string} **toAddress** - The address that received the transaction.
 * @property {number} **userAccountId** - The ID of the user account associated with the transaction.
 */
interface SaveTxPayload {
	/**
	 * The response from the transaction (partial means some of its fields could be removed for optimal compression - transmission size).
	 */
	txResponse: Partial<DeliverTxResponse>,
	/**
	 * The status of the transaction.
	 */
	txStatus: tx_status_enum,
	/**
	 * The address that initiated the transaction.
	 */
	fromAddress: string,
	/**
	 * The address that received the transaction.
	 */
	toAddress: string,
	/**
	 * The ID of the user account associated with the transaction.
	 */
	userAccountId: number,
}

function createSaveTxPayload(
	txResponse: Partial<DeliverTxResponse>,
	txStatus: tx_status_enum,
	fromAddress: string,
	toAddress: string,
	userAccountId: number,
) {
	// retain only fields that are needed from txResponse
	txResponse = pick(
		txResponse,
		["transactionHash", "code", "height", "gasWanted", "gasUsed", "events"]
	);
	const payload: SaveTxPayload = {
		txResponse: txResponse,
		txStatus: txStatus,
		fromAddress: fromAddress,
		toAddress: toAddress,
		userAccountId: userAccountId,
	};

	return payload;
}

export {
	SaveTxPayload,
	createSaveTxPayload,
}