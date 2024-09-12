import { deepStrictEqual } from 'assert';
import {
	compress,
	decompress,
	marshalAndCompress,
	decompressAndUnmarshal,
} from "../../../src/general/helpers/compress";
import { marshalPayload } from '../../../src/general/helpers/codec';
import { appLogger } from '../../../src/logs';

describe("compress() and decompress()", () => {
	it("should compress and decompress a Buffer", () => {
		const originalBuffer = Buffer.from("Hello, World!", "utf-8");
		const compressed = compress(originalBuffer);
		const decompressed = decompress(compressed);

		deepStrictEqual(decompressed, originalBuffer);
	});

	it("should compress and decompress a large Buffer", () => {
		const originalBuffer = Buffer.alloc(1024 * 1024); // 1MB buffer
		for (let i = 0; i < originalBuffer.length; i++) {
			originalBuffer[i] = Math.floor(Math.random() * 256);
		}

		const compressed = compress(originalBuffer);
		const decompressed = decompress(compressed);

		deepStrictEqual(decompressed, originalBuffer);
	});
});

describe("marshalAndCompress() and decompressAndUnmarshal()", () => {
	it("should marshal, compress, decompress, and unmarshal an object", () => {
		const originalObject = {
			I: "COSMOS",
			DontUnderstand: 699,
			Crytography: false,
			Bonus: BigInt("100000000000000000000000000000"),
		};

		const compressed = marshalAndCompress(originalObject);
		const unmarshalled = decompressAndUnmarshal(compressed);

		deepStrictEqual(unmarshalled, originalObject);
	});

	it('should marshal, compress, decompress, and unmarshal a string', () => {
		const originalString = "Hello Kitty!";

		const compressed = marshalAndCompress(originalString);
		const unmarshalled = decompressAndUnmarshal(compressed);

		deepStrictEqual(unmarshalled, originalString);
	});

	it("should marshal, compress, decompress, and unmarshal a number", () => {
		const originalNumber = 1;

		const compressed = marshalAndCompress(originalNumber);
		const unmarshalled = decompressAndUnmarshal(compressed);

		deepStrictEqual(unmarshalled, originalNumber);
	});

	it("should marshal, compress, decompress, and unmarshal a boolean", () => {
		const originalBoolean = true;

		const compressed = marshalAndCompress(originalBoolean);
		const unmarshalled = decompressAndUnmarshal(compressed);

		deepStrictEqual(unmarshalled, originalBoolean);
	});

	it("should marshal, compress, decompress, and unmarshal an array", () => {
		const originalArray = [1, 2, 3, 'foo', 'bar'];

		const compressed = marshalAndCompress(originalArray);
		const unmarshalled = decompressAndUnmarshal(compressed);

		deepStrictEqual(unmarshalled, originalArray);
	});

	it("should marshal, compress, decompress, and unmarshal a bigint", () => {
		const originalBigInt = BigInt("999999999999999999999999999999999");

		const compressed = marshalAndCompress(originalBigInt);
		const unmarshalled = decompressAndUnmarshal(compressed);

		deepStrictEqual(unmarshalled, originalBigInt);
	});

	it("should marshal, compress, then decompress, and unmarshal an object with nested properties", () => {
		const originalObject = {
			I: {
				Love: "random",
				And: "notANumber",
			},
			Hate: {
				Javascript: 90,
				AtTheSameTime: true,
			},
			Bonus: BigInt("1000000000000000000000000000000000000000"),
		};

		const compressed = marshalAndCompress(originalObject);
		const unmarshalled = decompressAndUnmarshal(compressed);

		deepStrictEqual(unmarshalled, originalObject);
	});

	it("compressed object should have smaller size than original object", () => {
		const originalObject = {
			I: {
				Love: "random",
				And: "notANumber",
			},
			Hate: {
				Javascript: 90,
				AtTheSameTime: true,
			},
			Bonus: BigInt("1000000000000000000000000000000000000000"),
		};

		const marshalled = marshalPayload(originalObject);
		const compressed = compress(marshalled);

		const orgSize = Buffer.byteLength(marshalled);
		const compSize = Buffer.byteLength(compressed)
		appLogger.debug(`compression: original size = ${orgSize} | compressed size = ${compSize}`);

		expect(compSize).toBeLessThanOrEqual(orgSize)
	})

	it ("decompress: convert strings that represent numbers, whose values are too big to bigint", () => {
		const originalNumberStr = "1000000000000000000000000000000000000000";
		const compressed = marshalAndCompress(originalNumberStr);
		const decompressed = decompressAndUnmarshal(compressed);
		deepStrictEqual(decompressed, BigInt(originalNumberStr));
	})
});
