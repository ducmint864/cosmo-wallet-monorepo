import config from "../config";
import PasswordValidator from "password-validator";
import emailValidator from "email-validator";
import createError from "http-errors";
import { prisma } from "../../database/prisma";
import { randomBytes } from "crypto";

const usernameMinLength = config.auth.username.minLength;
const usernameMaxLength = config.auth.username.maxLength;
const passwordMinLength = config.auth.password.minLength;
const passwordMaxLength = config.auth.password.maxLength;
const nicknameMinLength = config.auth.nickname.minLength;
const nicknameMaxLength = config.auth.nickname.maxLength;

const passwordSchema = new PasswordValidator()
	.min(config.auth.password.minLength, `Password must be between ${passwordMinLength} - ${passwordMaxLength} characters`)
	.max(config.auth.password.maxLength, `Password must be between ${passwordMinLength} - ${passwordMaxLength} characters`)
	.lowercase(1, "Password must contains lowercase letter(s)")
	.uppercase(1, "Password must contains uppercase letter(s)")
	.digits(1, "Password must contains digit(s)")
	.symbols(1, "Password must contains at least 1 symbol");

export function checkPasswordAndThrow(password: string) {
	const result = passwordSchema.validate(password, {
		list: true,
		details: true
	// eslint-disable-next-line
	}) as any[];

	if (result.length > 0) {
		throw createError(400,
			"Invalid password:\n" +
			result
				.map((criteria) => { return criteria.message; })
				.join("\n")
		);
	}
}

export function checkEmailAndThrow(email: string) {
	if (!emailValidator.validate(email)) {
		throw createError(400, "Invalid email");
	}
}

export function checkUsernameAndThrow(username: string) {
	const generalPattern = /^[a-zA-Z0-9_]+$/; // Only alphanumeric and underscores
	const containsLetter = /[a-zA-Z]/; // Must contains at least one letter

	let lengthErr = false;
	let symbolErr = false;
	let letterErr = false;

	const length = username.length;
	if (!(length >= usernameMinLength && usernameMaxLength <= 16)) {
		lengthErr = true;
	}

	if (!generalPattern.test(username)) {
		symbolErr = true;
	}

	if (!containsLetter.test(username)) {
		letterErr = true;
	}

	if (symbolErr || lengthErr || letterErr) {
		throw createError(400,
			"Invalid username:\n"
			+ (lengthErr ? `Username must be between ${usernameMinLength}  -  ${usernameMaxLength} characters\n` : "")
			+ (symbolErr ? "Username can only contain alphanumerics and underscores\n" : "")
			+ (letterErr ? "Username must contain at least 1 letter\n" : "")
		);
	}
}

export async function genUsername(): Promise<string> {
	let _username;
	
	while (true) {
		_username = randomBytes(6).toString("hex"); // Choose length of 12 chars (6 bytes) to balance between collision rate and speed
		const containsLetter = (_username.search(/[a-zA-Z]/) !== -1);
		const taken = (await prisma.base_account.findUnique({
			where: {
				username: _username
			}
		}) != null);
		if (containsLetter && !taken) {
			break;
		}
	}	

	return _username;
}


export function checkNicknameAndThrow(nickname: string) {
	if (!(nickname.length >= 1 && nickname.length <= 16)) {
		throw createError(400, `Invalid nickname: Nickname must be between ${nicknameMinLength} - ${nicknameMaxLength} characters`);
	}
}