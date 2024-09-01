function getRedisKey(prefix: string, ...subNames: string[]): string {
	let redisKey: string = prefix;
	subNames.forEach((name) => redisKey = redisKey.concat(".", name));
	return redisKey;
}

export {
	getRedisKey,
}