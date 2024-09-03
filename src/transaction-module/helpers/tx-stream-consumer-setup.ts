import { Worker } from 'worker_threads';
import { txConfig } from '../../config';

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
	console.log("MAIN THREAD IS RUNNING");
	// create a consumer thread which will execute the code in the following file 

	// stop consumer thread on SIGINT
	process.on("SIGINT", async () => {
		consumer.postMessage("stop");
		process.exit(0);
	});

	// handle messages from consumer thread
	consumer.on("message", (message) => {
		if (typeof message === "string" && message.startsWith("LOG:")) {
			console.log(message.slice(4)); // Remove "LOG:" prefix
		}
	});
}

async function startTxStreamConsumer(): Promise<void> {
	const consumerExecutableFile: string = txConfig.txStream.consumerThread.executableFile;
	const consumer: Worker = await createConsumerThread(consumerExecutableFile);
	console.log("CREATED CONSUMER THREAD");
	setupCommunicationWithConsumer(consumer);
}

export {
	startTxStreamConsumer,
}