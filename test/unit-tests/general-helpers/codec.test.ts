import { makeSerializable, marshalPayload, unmarshalPayload } from "../../../src/general/helpers/codec";
import { deepStrictEqual } from "assert";

describe("makeSerializable()", () => {
	it("should convert a bigint to a string", () => {
		const originalBigInt = BigInt(123);
		const serializable = makeSerializable(originalBigInt);

		// expect(serializable).toBe("123");
		const expected = "123";
		deepStrictEqual(serializable, expected);
	});

	it("should recursively convert an array of bigints to strings", () => {
		const originalArray = [BigInt(1), BigInt(2), BigInt(3)];
		const serializable = makeSerializable(originalArray);

		expect(serializable).toEqual(['1', '2', '3']);
	});

	it("should recursively convert an object with bigint properties to strings", () => {
		const originalObject = {
			foo: BigInt(123),
			bear: "baz",
			wallet: {
				MyBTCBalance: BigInt(99999999999999),
			},
		};

		const serializable = makeSerializable(originalObject);

		const expected = {
			foo: "123",
			bear: "baz",
			wallet: {
				MyBTCBalance: "99999999999999",
			}
		}
		deepStrictEqual(serializable, expected);
	});

	it("should not modify a string", () => {
		const originalString = "Goodbye, World!";
		const serializable = makeSerializable(originalString);

		expect(serializable).toBe(originalString);
	});

	it("should not modify a number", () => {
		const originalNumber = 123;
		const serializable = makeSerializable(originalNumber);

		expect(serializable).toBe(originalNumber);
	});

	it("should not modify a boolean", () => {
		const originalBoolean = true;
		const serializable = makeSerializable(originalBoolean);

		expect(serializable).toBe(originalBoolean);
	});

	it("should not modify null", () => {
		const originalNull: any = null;
		const serializable = makeSerializable(originalNull);

		expect(serializable).toBe(originalNull);
	});

	it("should not modify undefined", () => {
		const originalUndefined: any = undefined;
		const serializable = makeSerializable(originalUndefined);

		expect(serializable).toBe(originalUndefined);
	});

	it("should recursively convert a nested object", () => {
		const originalObject = {
			foo: {
				bar: {
					baz: {
						cry: BigInt(123),
					}
				},
			},
			foo2: {
				bar2: {
					baz2: {
						smile: BigInt(321),
					}
				},
			},
		};

		const serializable = makeSerializable(originalObject);

		const expected = {
			foo: {
				bar: {
					baz: {
						cry: "123"
					}
				},
			},
			foo2: {
				bar2: {
					baz2: {
						smile: "321",
					}
				},
			},
		}
		deepStrictEqual(serializable, expected);
	});
	it("should recursively convert a nested array", () => {
		const originalArray = [
			[BigInt(1), BigInt(2)],
			[BigInt(3), BigInt(4)],
		];

		const serializable = makeSerializable(originalArray);

		const expected = [
			["1", "2"],
			["3", "4"],
		];
		deepStrictEqual(serializable, expected);
	});
});

describe("marshalPayload() and unmarshalPayload()", () => {
	it("should marshal and unmarshal a simple object", () => {
		const originalPayload = { foo: 'bar' };
		const marshalled = marshalPayload(originalPayload);
		const unmarshalled = unmarshalPayload(marshalled);

		// expect(unmarshalled).toEqual(originalPayload);
		deepStrictEqual(unmarshalled, originalPayload);
	});

	it("should marshal and unmarshal a complex object", () => {
		const originalPayload = {
			IAm: "bar",
			Crypto: [1, 2, 3],
			Billionaire: { data: "BTC" },
		};
		const marshalled = marshalPayload(originalPayload);
		const unmarshalled = unmarshalPayload(marshalled);

		// expect(unmarshalled).toEqual(originalPayload);
		deepStrictEqual(unmarshalled, originalPayload);
	});

	it("should marshal and unmarshal an uncommon type like bigint", () => {
		const originalBigInt = BigInt("9999999999999999999999999999999999");
		const marshalled = marshalPayload(originalBigInt);
		const unmarshalled = unmarshalPayload(marshalled);

		// expect(unmarshalled).toEqual(originalPayload);
		deepStrictEqual(unmarshalled, originalBigInt);
	});

	it("should marshal and unmarshal a buffer", () => {
		const originalBuffer = Buffer.from("Hello, World!", "utf-8");
		const marshalled = marshalPayload(originalBuffer);
		const unmarshalled = unmarshalPayload(marshalled);

		// expect(unmarshalled).toEqual(originalBuffer);
		// expect(unmarshalled).toEqual(originalBuffer);
		deepStrictEqual(originalBuffer,unmarshalled)
	});
	
	it("should throw an error when unmarshalling falsely-encoded data", () => {
		const invalidMarshalled = Buffer.from("Invalid data", "utf-8");

		expect(() => unmarshalPayload(invalidMarshalled)).toThrow();
	});
});