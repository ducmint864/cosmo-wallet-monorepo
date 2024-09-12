import { makeRequestWithTimeout } from "../../../src/transaction-module/helpers/request";
// import { redisClient } from "../../../src/connections";

jest.mock('../../../src/connections', () => ({
	redisClient: {
		isOpen: false,
		connect: jest.fn(),
		get: jest.fn(),
		set: jest.fn(),
	},
}));

describe("makeRequestWithTimeout()", () => {
	/**
	 * arrangements
	 */
	beforeEach(() => {
		jest.clearAllMocks();
	})

	afterEach(done => done());

	/**
	 * test cases
	 */
	it("should throw error if waiting time exceeds timeout limit", async () => {
		const timeoutMilisecs: number = 0.5 * 100;
		const mockRequestFunc = async (): Promise<number> => {
			const data: number = 10;
			return new Promise<number>((resolve, _) => {
				setTimeout(() => resolve(data), timeoutMilisecs + 1); // higher than timeout limit
			});
		};

		await expect(makeRequestWithTimeout(timeoutMilisecs, mockRequestFunc)).rejects.toThrow("Request timed out");
	});

	it("should resolves value if time wait time doesn't exceed limit", async () => {
		const timeoutMilisecs: number = 0.5 * 100;

		const testNumber: number = 100000000;
		const mockRequestFunc = async (data: number): Promise<number> => {
			return new Promise<number>((resolve, _) => {
				setTimeout(() => resolve(data), timeoutMilisecs - 100); // lower than timeout limit
			});
		};

		await expect(makeRequestWithTimeout(timeoutMilisecs, mockRequestFunc, testNumber)).resolves.toEqual(testNumber);
	});

	it("should recognize and handle all arguments passed in", async () => {
		const timeoutMilisecs: number = 0.5 * 100;

		const testNum1 = BigInt("1000000000000000000000000000000");
		const testNum2 = BigInt("1000000000000000000000000000001");
		const testNum3 = BigInt("1000000000000000000000000000011");

		const max = (num1: bigint, num2: bigint): bigint => {
			return num1 > num2 ? num1 : num2;
		};

		const mockRequestFunc = async (num1: bigint, num2: bigint, num3: bigint): Promise<bigint> => {
			const largest: bigint = max(max(num1, num2), num3);
			return new Promise<bigint>((resolve, _) => {
				setTimeout(() => resolve(largest), timeoutMilisecs - 100); // lower than timeout limit
			});
		};

		await expect(makeRequestWithTimeout(timeoutMilisecs, mockRequestFunc, testNum1, testNum2, testNum3)).resolves.toEqual(testNum3);
	})
})