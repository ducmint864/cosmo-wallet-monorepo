async function timeoutFunc(timeoutMilisecs: number): Promise<void> {
	await new Promise((_, reject) => {
		const err: Error = new Error("timeout");
		setTimeout(() => reject(err), timeoutMilisecs);
	});
}

async function makeRequestWithTimeout<T>(
	timeoutMilisecs: number,
	requestFunc: (...args: any[]) => Promise<T>,
	...requestArgs: any[]
): Promise<T> {
	try {
		const resolvedPromise = await Promise.race([
			timeoutFunc(timeoutMilisecs),
			requestFunc(...requestArgs),
		]);

		if (!resolvedPromise) {
			throw new Error("Request returned void or nil");
		}
		return resolvedPromise as T;
	} catch (err) {
		if (err.message === "timeout") {
			throw new Error("Request timed out");
		}
	}
}

export {
	makeRequestWithTimeout,
}