import { NextFunction } from "express";
import { contentSecurityPolicy } from "helmet";
import { securityConfig } from "../../config";

// (XSS) Instruct browsers to display/execute resources from these trusted sources only:
async function applyContentSecurityPolicy(
	req: any,
	res: any,
	next: NextFunction
): Promise<void> {
	contentSecurityPolicy(securityConfig.csp.policies);
	next();
}

export {
	applyContentSecurityPolicy,
}