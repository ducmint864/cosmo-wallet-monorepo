import { encode, decode } from "@msgpack/msgpack";

/**
 * Recursively converts an object into a serializable format, handling bigints, arrays, and objects.
 * 
 * @param obj The object to make serializable.
 * @returns The object in a serializable format.
 */
function makeSerializable(obj: any): any {
	if (typeof obj === 'bigint') {
		return obj.toString();
	} else if (obj instanceof Uint8Array || obj instanceof Buffer) {
		return Buffer.from(obj);
	} else if (Array.isArray(obj)) {
		return obj.map(makeSerializable);
	} else if (typeof obj === 'object' && obj !== null) {
		return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, makeSerializable(value)]));
	} else {
		return obj;
	}
};

/**
 *	Undo the effect of makeSerializable() 
 * @param obj 
 * @returns 
 */
function undoMakeSerializable(obj: any): any {
	if (typeof obj === "string" && /^\d+$/.test(obj)) {
		if (obj.at(0) === "0") {
			return obj;
		}
		const num = Number(obj);
		if (!Number.isSafeInteger(num)) {
			return BigInt(obj);
		}
		return num;
	} else if (obj instanceof Uint8Array || obj instanceof Buffer) {
		return Buffer.from(obj);
	} else if (Array.isArray(obj)) {
		return obj.map(undoMakeSerializable);
	} else if (typeof obj === 'object' && obj !== null) {
		return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, undoMakeSerializable(value)]));
	} else {
		return obj;
	}
}

/**
 * @dev using msgpack lib for marshalling/unmarshalling instead of JSON
 */

/**
 * Marshal (serialize) a payload to a Buffer.
 * 
 * @param payload The payload object to marshal.
 * @returns The marshalled payload as a Buffer.
 */
function marshalPayload<T>(payload: T): Buffer {
	const serializablePayload = makeSerializable(payload);
	return Buffer.from(encode(serializablePayload));
}

/**
 * Unmarshal (deserialize) a payload from a Buffer.
 * 
 * @param marshalled The marshalled payload as a Buffer.
 * @returns The unmarshalled payload object.
 */
function unmarshalPayload<T>(marshalled: Buffer): T {
	const unmarshalled = decode(marshalled);
	return undoMakeSerializable(unmarshalled);
}

export {
	makeSerializable,
	undoMakeSerializable,
	marshalPayload,
	unmarshalPayload,
}