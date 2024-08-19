import { NextFunction } from "express";
import { contentSecurityPolicy } from "helmet";
import { securityConfig } from "../../config";
import { redisClient } from "../../connections";

const redisKeyPrefix = "csp";
const cspDirectivesRedisKey = redisKeyPrefix.concat(".", "directives");
const cspDirectivesChangedRedisKey = cspDirectivesRedisKey.concat(".", "changed")
let cspDirectives: Record<string, string[]>;

// Func to init this module
async function initModule(): Promise<void> {
	cspDirectives = await getCspDirectivesInRedis();
	if (cspDirectives === null) {
		const defaultDirectives: object = securityConfig.csp.policies.directives; 
		setCspDirectivesInRedis(defaultDirectives);
	}
}

async function getCspDirectivesInRedis(): Promise<Record<string, string[]>> {
	const strCspDirectives: string = await redisClient.GET(cspDirectivesRedisKey)
	let directives: Record<string, string[]>;

	if (!strCspDirectives) {
		return null;
	}

	directives = JSON.parse(strCspDirectives)
	return directives
}

async function setCspDirectivesInRedis(directives: object) {
	if (!directives) {
		return;
	}
	console.log("IM HERE")
	await redisClient.SET(
		cspDirectivesRedisKey,
		JSON.stringify(directives, null, 4)
	)
	console.log("IM HERE 2")
	await redisClient.SET(
		cspDirectivesChangedRedisKey,
		"true"
	);
	console.log("IM HERE 2")
}

// (XSS) Instruct browsers to display/execute resources from these trusted sources only:
async function applyContentSecurityPolicy(
	req: any,
	res: any,
	next: NextFunction
): Promise<void> {
	// Refresh local directives
	const strValue: string | null = await redisClient.GET(cspDirectivesChangedRedisKey);
	const directivesChanged: boolean = Boolean(strValue);

	console.log("DEBUG: directives changed ?: ", directivesChanged);
	if (!directivesChanged) {
		return;
	}

	cspDirectives = await getCspDirectivesInRedis();

	// Apply CSP policies
	console.log("Debug: csp directives:\n", cspDirectives);
	contentSecurityPolicy({
		directives: cspDirectives,
	})(req, res, next);
	contentSecurityPolicy(cspDirectives);
}


initModule()
	.then()
	.catch(e => console.error("initModule() failed:\n", e))

export {
	applyContentSecurityPolicy,
	getCspDirectivesInRedis,
	setCspDirectivesInRedis,
}
