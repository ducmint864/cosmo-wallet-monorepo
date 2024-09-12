import { Worker } from 'worker_threads';
import { txConfig } from '../../config';
import { appLogger } from '../../logs';

async function createConsumerThread(consumerExecutableFile: string): Promise<Worker> {
	const threadNameKey: string = txConfig.txStream.consumerThread.nameKey;
	const threadNameValue: string = txConfig.txStream.consumerThread.nameValue;
	const threadIdKey: string = txConfig.txStream.consumerThread.idKey;

	const consumer = new Worker(consumerExecutableFile, {
		workerData: {
			[threadNameKey]: threadNameValue,
			[threadIdKey]: undefined,
		},
	});

	return consumer;
}

// actions that the producer thread (i.e the main thread) is responsible for
function setupCommunicationWithConsumer(consumer: Worker): void {
	// stop consumer thread on SIGINT
	process.on("SIGINT", async () => {
		consumer.postMessage("stop");
		process.exit(0);
	});

	// handle messages from consumer thread
	consumer.on("message", (message) => {
		if (typeof message !== "string") {
			return;
		}

		const msgParts: string[] = message.split("|");
		if (msgParts.length < 2) {
			return;
		}
		const logLevel: string = msgParts[0].toLowerCase();
		const content: string = "tx consumer thread: ".concat(msgParts[1]);

		switch (logLevel) {
			case "trace":
				appLogger.trace(content);
				break;
			case "debug":
				appLogger.debug(content);
				break;
			case "info":
				appLogger.info(content);
				break;
			case "warn":
				appLogger.warn(content);
				break;
			case "error":
				appLogger.error(content);
				break;
			case "fatal":
				appLogger.fatal(content);
				break;
			default:
				appLogger.info(content);
				break;
		}
	});
}

async function startTxStreamConsumer(): Promise<void> {
			const consumerExecutableFile: string = txConfig.txStream.consumerThread.executableFile;

			// create a consumer thread which will execute the code in the following file 
			const consumer: Worker = await createConsumerThread(consumerExecutableFile);
			setupCommunicationWithConsumer(consumer);
			appLogger.trace("tx-stream: consumer thread is running!");
		}

export {
		startTxStreamConsumer,
	}