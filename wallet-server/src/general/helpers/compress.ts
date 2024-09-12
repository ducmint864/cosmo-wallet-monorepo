import * as lz4 from "lz4"
import {  encodeBlock, decodeBlock, encodeBound } from "lz4"
import { marshalPayload, unmarshalPayload } from "./codec";

/**
 * Compress a Buffer using LZ4
 * 
 * @param data The data to compress.
 * @returns The compressed data as a Buffer.
 **/
function compress(data: Buffer): Buffer {
	const outputBuffer = Buffer.alloc(encodeBound(data.length)); // Allocate maximum buffer size
	const compressedSize = encodeBlock(data, outputBuffer);      // Compress data
	return outputBuffer.subarray(0, compressedSize);
}

/**
 * Decompress a Buffer using LZ4
 * 
 * @param compressed The compressed data as a Buffer.
 * @returns The decompressed data as a Buffer.
 */
function decompress(compressed: Buffer): Buffer {
	const outputBuffer = Buffer.alloc(compressed.length * 255);  // Allocate buffer for decompressed data
	const decompressedSize = decodeBlock(compressed, outputBuffer); // Decompress data
	return outputBuffer.subarray(0, decompressedSize);              // Return only the decompressed data
}

/**
 * Marshal and compress a payload.
 * 
 * @param payload The payload object to marshal and compress.
 * @returns The marshalled and compressed data as a Buffer.
 */
function marshalAndCompress<T>(payload: T): Buffer {
	const marshalled = marshalPayload(payload); // Marshal the payload to a Buffer
	return compress(marshalled);                // Compress the marshalled Buffer
}

/**
 * Decompress and unmarshal a payload.
 * 
 * @param compressed The compressed data as a Buffer.
 * @returns The decompressed and unmarshalled payload object.
 */
function decompressAndUnmarshal<T>(compressed: Buffer): T {
	const decompressed = decompress(compressed); // Decompress the Buffer
	return unmarshalPayload(decompressed);       // Unmarshal the decompressed Buffer back to an object
}

export {
	compress,
	decompress,
	marshalAndCompress,
	decompressAndUnmarshal,
}