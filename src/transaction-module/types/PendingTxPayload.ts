import { DeliverTxResponse } from "@cosmjs/stargate"
import { tx_status_enum } from "@prisma/client"

/**
 * Payload for a pending transaction.
 * 
 * @property {DeliverTxResponse} **txResponse** - The response from the transaction.
 * @property {tx_status_enum} **txStatus** - The status of the transaction.
 * @property {string} **fromAddress** - The address that initiated the transaction.
 * @property {string} **toAddress** - The address that received the transaction.
 * @property {number} **userAccountId** - The ID of the user account associated with the transaction.
 */
export interface PendingTxPayload {
	/**
	 * The response from the transaction.
	 */
	txResponse: DeliverTxResponse,
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
