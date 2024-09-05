import { describe, expect, test } from '@jest/globals';
import request from "supertest"
import { app } from "../../../src/index";
import { prisma } from '../../../src/connections';
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
	const mainEmail: string = process.env["INTEGRATION_TEST_MAIN_EMAIL"] as string;
	const mainPassword: string = process.env["INTEGRATION_TEST_MAIN_PASSWORD"] as string;
	const mainAddress: string = process.env["INTEGRATION_TEST_MAIN_ADDRESS"] as string;
	const bobAddress: string = process.env["INTEGRATION_TEST_BOB_ADDRESS"] as string;
	const aliceAddress: string = process.env["INTEGRATION_TEST_ALICE_ADDRESS"] as string;

	beforeAll(async () => {
		expect(mainEmail).not.toBeUndefined();
		expect(mainEmail).not.toBeFalsy();
		expect(mainPassword).not.toBeUndefined();
		expect(mainPassword).not.toBeFalsy();
		expect(mainAddress).not.toBeUndefined();
		expect(mainAddress).not.toBeFalsy();
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
		] = await loginAndReturnTokens(mainEmail, mainPassword);

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
				password: mainPassword,
				fromAddress: mainAddress, // my wallet's address
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
				password: mainPassword,
				fromAddress: mainAddress, // my wallet's address
				toAddress: bobAddress,  // Bob's address
				coin: {
					denom: "stake",
					amount: "1"
				}
			});

		expect(res.status).toBe(403);
	});

	it("should respond with http status code 403 if provide invalid password", async () => {
		const wrongPassword: string = reverseString(mainPassword);

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
				fromAddress: mainAddress, // my wallet's address
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
				password: mainPassword,
				fromAddress: mainAddress, // my wallet's address
				toAddress: bobAddress,  // Bob's address
				coin: {
					denom: "stake",
					amount: "1"
				}
			});

		expect(res.status).toBe(200);
	});

	it("handles multiple transactions at once well enough", async () => {
		// register multiple test accounts
		type Account = {
			userAccountId: number,
			email: string,
			password: string,
			mainWallet: {
				walletAccountId: number,
				address: string,
			}
			csrfToken: string,
			accessToken: string,
			refreshToken: string,
		};

		const stateMap = new Map<string, Partial<Account>>();
		const txHashList: string[] = [];

		try {
			const emails: string[] = (process.env.INTEGRATION_TEST_MULTI_EMAILS as string)?.split(",");
			const password: string = (process.env.INTEGRATION_TEST_MAIN_PASSWORD as string);
			expect(emails).not.toBeUndefined();
			expect(emails.length).not.toBeLessThan(1);
			expect(password).not.toBeUndefined();
			expect(password).not.toBeFalsy();

			for (const email of emails) {
				// register multiple accounts
				const registerRes = await request(app)
					.post("/api/auth/register")
					.set("Accept", "application/json")
					.send({
						"email": email,
						"password": password,
					});
				console.log(registerRes.body);

				// save account info 
				stateMap.set(email, {
					"email": email,
					"password": password,
					"mainWallet": {
						"address": registerRes.body["mainWallet"]["address"],
						"walletAccountId": registerRes.body["mainWallet"]["walletAccountId"],
					},
					"userAccountId": registerRes.body["mainWallet"]["userAccountId"],
				});
				expect(registerRes.status).toBe(201);

				// use main account to fund those test accounts
				const sendRes = await request(app)
					.post("/api/transaction/bank/send-coin")
					.set("Accept", "application/json")
					.set("x-csrf-token", csrfToken)
					.set("Cookie", [
						`accessToken=${accessToken}`,
						`refreshToken=${refreshToken}`,
					])
					.send({
						password: mainPassword,
						fromAddress: mainAddress, // my wallet's address
						toAddress: stateMap.get(email)?.mainWallet?.address,  // Bob's address
						coin: {
							denom: "stake",
							amount: "100"
						}
					});
				expect(sendRes.status).toBe(200);
				txHashList.push(sendRes.body["txHash"]);

				// then login to those accounts
				const tokens = await loginAndReturnTokens(email, password);
				stateMap.set(email, {
					...stateMap.get(email),
					"csrfToken": tokens[0],
					"accessToken": tokens[1],
					"refreshToken": tokens[2],
				});
				expect(stateMap.get(email)?.accessToken).not.toBeUndefined();
				expect(stateMap.get(email)?.csrfToken).not.toBeUndefined();
				expect(stateMap.get(email)?.refreshToken).not.toBeUndefined();
			}

			// act as those test accounts to send multiple transactions at once
			const promises = Array.from(stateMap.values()).map((account) => {
				return request(app)
					.post("/api/transaction/bank/send-coin")
					.set("Accept", "application/json")
					.set("x-csrf-token", account.csrfToken!)
					.set("Cookie", [
						`accessToken=${account.accessToken}`,
						`refreshToken=${account.refreshToken}`,
					])
					.send({
						password: account.password,
						fromAddress: account.mainWallet?.address,
						toAddress: bobAddress,
						coin: {
							denom: "stake",
							amount: "1"
						}
					});
			});

			const results = await Promise.all(promises);
			results.forEach((res) => {
				expect(res.status).toBe(200);
				txHashList.push(res.body["txHash"]);
			});
		} catch (ignored) {
			// expect(ignored).toThr
			throw (ignored);
		} finally {
			// cleanup: delete all db records made in this test case

			/**
			 * THIS METHOD ALWAYS FAIL ON FK ERROR FOR SOME REASON
			 */
			// await prisma.transaction_fees.deleteMany({
			// 	where: {
			// 		transactions: {
			// 			tx_hash: {
			// 				in: txHashList
			// 			}
			// 		}
			// 	}
			// });
			// await prisma.$transaction(async (prismaTran) => {
			// 	await prismaTran.$queryRaw`delete from transaction_fees
			// 	where tx_id in (
			// 		select tx_id from transactions
			// 		where tx_hash in (${Prisma.join(txHashList)})
			// 	);
			// `;
			// 	console.log("TX HASH LIST: ", txHashList.join(", "));
			// 	await prismaTran.transactions.deleteMany({
			// 		where: {
			// 			tx_hash: {
			// 				in: txHashList
			// 			}
			// 		}
			// 	});
			// 	await prismaTran.wallet_accounts.deleteMany({
			// 		where: {
			// 			wallet_account_id: {
			// 				in: Array.from(stateMap.values()).map(account => account.mainWallet!.walletAccountId)
			// 			}
			// 		}
			// 	});
			// 	await prismaTran.user_accounts.deleteMany({
			// 		where: {
			// 			user_account_id: {
			// 				in: Array.from(stateMap.values()).map(account => account.userAccountId!)
			// 			}
			// 		}
			// 	})
			// });

			await prisma.$transaction(async (prismaTrans) => {
				await prismaTrans.transaction_fees.deleteMany({
					where: {}
				});
				await prismaTrans.transactions.deleteMany({
					where: {}
				});
				await prismaTrans.wallet_accounts.deleteMany({
					where: {
						wallet_account_id: {
							in: Array.from(stateMap.values()).map((account) => account.mainWallet?.walletAccountId!)
						}
					}
				})
				await prismaTrans.user_accounts.deleteMany({
					where: {
						user_account_id: {
							in: Array.from(stateMap.values()).map((account) => account.userAccountId!)
						}
					}
				})
			});
		}

	}, 70 * 1000);
});