import { startTxStreamConsumer } from "./helpers/tx-stream-consumer-setup"

async function initTransactionModule(): Promise<void> {
	await startTxStreamConsumer();
}

export {
	initTransactionModule,
}