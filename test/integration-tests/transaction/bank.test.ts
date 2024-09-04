import { describe, expect, test } from '@jest/globals';
import request from "supertest"
import { app } from "../../../src/index";
import "dotenv/config";

/**
 * @dev Provide a user account, which have at least 1 wallet account,
 * such wallet account is identified by an address.
 * Also, specify Bob and Alice addresses of your test chain 
 * In summary, fulfil these .env variables:
 * - INTEGRATION_TEST_EMAIL (email of user account)
 * - INTEGRATION_TEST_PASSWORD(password of user account)
 * - INTEGRATION_TEST_ADDRESS (address of wallet account)
 * - INTEGRAITON_TEST_BOB_ADDRESS (address of Bob wallet account)
 * - INTEGRATION_TEST_ALICE_ADDRESS (address of Alice wallet account)
 *
 *  */

/**
 * 
 * search in cookies to find the token with name of ${tokenName}
 * @param cookies 
 * @param tokenName 
 * @returns 
 * @example Here's what cookies (string[]) really look like:
 *  [
	  'accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
	  'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
	  'csrfToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
	  'accessToken=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx; Max-Age=300; Path=/; Expires=Wed, 04 Sep 2024 11:46:33 GMT; HttpOnly; Secure; SameSite=Strict',
	  'refreshToken=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxx; Max-Age=14400; Path=/; Expires=Wed, 04 Sep 2024 15:41:33 GMT; HttpOnly; Secure; SameSite=Strict',
	  'csrfToken=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx; Max-Age=14400; Path=/; Expires=Wed, 04 Sep 2024 15:41:33 GMT; Secure; SameSite=Strict'
	]
 */
function parseTokenFromCookies(cookies: string[], tokenName: string): string {
	const token: string = cookies
		.filter((cookie: string) => cookie.includes(`${tokenName}=`))
		.reduce((longestStr, currentStr) => {
			if (!longestStr) {
				return currentStr;
			}
			return currentStr.length > longestStr.length ? currentStr : longestStr;
		})
		?.split("=")[1]
		.split(";")[0]!

	return token;
}

function reverseString(value: string): string {
	let reversed = "";
	for (let i = value.length - 1; i >= 0; i--) {
		reversed = reversed.concat(value[i]);
	}
	return reversed;
}

async function loginAndReturnTokens(
	inputEmail: string,
	inputPassword: string,
): Promise<[
	csrfToken: string,
	accessToken: string,
	refreshToken: string,
]> {
	const res = await request(app)
		.post("/api/auth/login")
		.set("Accept", "application/json")
		.send({ email: inputEmail, password: inputPassword });
	const cookies: string[] = (res.headers["set-cookie"] as unknown) as string[];
	expect(res.status).toBe(200);

	const csrfToken: string = parseTokenFromCookies(cookies, "csrfToken");
	const accessToken: string = parseTokenFromCookies(cookies, "accessToken");
	const refreshToken: string = parseTokenFromCookies(cookies, "refreshToken");

	return [
		csrfToken,
		accessToken,
		refreshToken,
	];
}

describe("sending coins API", () => {
	// persistent accross test cases
	let csrfToken: string;
	let accessToken: string;
	let refreshToken: string;
	const testEmail: string = process.env["INTEGRATION_TEST_EMAIL"] as string;
	const testPassword: string = process.env["INTEGRATION_TEST_PASSWORD"] as string;
	const testAddress: string = process.env["INTEGRATION_TEST_ADDRESS"] as string;
	const bobAddress: string = process.env["INTEGRATION_TEST_BOB_ADDRESS"] as string;
	const aliceAddress: string = process.env["INTEGRATION_TEST_ALICE_ADDRESS"] as string;

	beforeAll(async () => {
		expect(testEmail).not.toBeUndefined();
		expect(testEmail).not.toBeFalsy();
		expect(testPassword).not.toBeUndefined();
		expect(testPassword).not.toBeFalsy();
		expect(testAddress).not.toBeUndefined();
		expect(testAddress).not.toBeFalsy();
		expect(bobAddress).not.toBeUndefined();
		expect(bobAddress).not.toBeFalsy();
		expect(aliceAddress).not.toBeUndefined();
		expect(aliceAddress).not.toBeFalsy();
	});

	beforeEach(async () => {
		[
			csrfToken,
			accessToken,
			refreshToken
		] = await loginAndReturnTokens(testEmail, testPassword);

		expect(csrfToken).not.toBeFalsy();
		expect(accessToken).not.toBeUndefined();
		expect(accessToken).not.toBeFalsy();
		expect(refreshToken).not.toBeUndefined();
		expect(refreshToken).not.toBeFalsy();
	});

	afterEach(async () => {

	});

	afterAll(async () => {

	});

	it("should respond with http status code 403 if user have invalid access-token", async () => {
		// reverse access token
		const wrongAccessToken: string = reverseString(accessToken);
		const res = await request(app)
			.post("/api/transaction/bank/send-coin")
			.set("Accept", "application/json")
			.set("x-csrf-token", csrfToken)
			.set("Cookie", [
				`accessToken=${wrongAccessToken}`,
				`refreshToken=${refreshToken}`,
			])
			.send({
				password: testPassword,
				fromAddress: testAddress, // my wallet's address
				toAddress: bobAddress,  // Bob's address
				coin: {
					denom: "stake",
					amount: "1"
				}
			});

		expect(res.status).toBe(403);
	});

	it("should respond with http status code 403 if user have an invalid csrf-token", async () => {
		const wrongCsrfToken = csrfToken.toLowerCase();

		const res = await request(app)
			.post("/api/transaction/bank/send-coin")
			.set("Accept", "application/json")
			.set("x-csrf-token", wrongCsrfToken)
			.set("Cookie", [
				`accessToken=${accessToken}`,
				`refreshToken=${refreshToken}`,
			])
			.send({
				password: testPassword,
				fromAddress: testAddress, // my wallet's address
				toAddress: bobAddress,  // Bob's address
				coin: {
					denom: "stake",
					amount: "1"
				}
			});

		expect(res.status).toBe(403);
	});

	it("should respond with http status code 403 if provide invalid password", async () => {
		const wrongPassword: string = reverseString(testPassword);

		const res = await request(app)
			.post("/api/transaction/bank/send-coin")
			.set("Accept", "application/json")
			.set("x-csrf-token", csrfToken)
			.set("Cookie", [
				`accessToken=${accessToken}`,
				`refreshToken=${refreshToken}`,
			])
			.send({
				password: wrongPassword,
				fromAddress: testAddress, // my wallet's address
				toAddress: bobAddress,  // Bob's address
				coin: {
					denom: "stake",
					amount: "1"
				}
			});

		expect(res.status).toBe(403);
	});

	it("should send coin normally if password, all tokens are correct, and sender has enough coin balance", async () => {
		const res = await request(app)
			.post("/api/transaction/bank/send-coin")
			.set("Accept", "application/json")
			.set("x-csrf-token", csrfToken)
			.set("Cookie", [
				`accessToken=${accessToken}`,
				`refreshToken=${refreshToken}`,
			])
			.send({
				password: testPassword,
				fromAddress: testAddress, // my wallet's address
				toAddress: bobAddress,  // Bob's address
				coin: {
					denom: "stake",
					amount: "1"
				}
			});

		expect(res.status).toBe(200);
	});
});