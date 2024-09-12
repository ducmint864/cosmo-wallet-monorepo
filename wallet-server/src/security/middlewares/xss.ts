import { Request, Response, NextFunction } from "express";
import { errorHandler } from "../../errors/middlewares/error-handler";
import { requestDataConfig } from "../../config";
import createHttpError from "http-errors";
import xss from "xss";

const xssSanitizerOptions = {
	whiteList: {
		// 	a: ['href', 'title', 'target'],
		// 	img: ['src', 'alt'],
	},
	stripIgnoreTag: true, // Escape all HTML tags that are not in the whitelist -> normal texts
	stripIgnoreTagBody: ['script'], // Remove content inside <script> tags
};

type SanitizedObject = string | Record<string, any>;

const MAX_NEST_LEVEL: number = requestDataConfig.objects.maxNestLevel; // Prevent overflowing attacks

/**
 * Recursively sanitizes an object by removing malicious HTML tags and attributes.
 * 
 * @param {Record<string, any>} obj - Object to sanitize
 * @param {number} [nestLevel=1] - Current nesting level
 * @returns {SanitizedObject} Sanitized object
 */
function _sanitize(obj: Record<string, any>, nestLevel: number = 1): SanitizedObject {
	if (obj && typeof obj === "object") {
		if (nestLevel > MAX_NEST_LEVEL) {
			throw createHttpError(400, "Request data too nested");
		}

		Object.keys(obj).forEach((key) => {
			obj[key] = _sanitize(obj[key], nestLevel + 1);
		});

	} else if (typeof obj === "string") {
		return xss(obj, xssSanitizerOptions);
	}

	return obj;
}

/**
 * This middleware sanitizes user input to prevent XSS attacks. 
 * Use it selectively with each route because repeated, unnecessary usage can affect performance
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * 
 * @example
 * app.use(sanitizeInput);
 */
function sanitizeInput(
	req: Request,
	res: Response,
	next: NextFunction
) {
	try {
		if (req.query) {
			req.query = _sanitize(req.query) as { [key: string]: string }
		}

		if (req.params) {
			req.params = _sanitize(req.params) as { [key: string]: string };
		}

		if (req.body) {
			req.body = _sanitize(req.body) as { [key: string]: string }
		}

		next();
	} catch (err) {
		errorHandler(err, req, res, next);
	}
}

export { sanitizeInput };