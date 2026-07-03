/**
 * Filesystem-backed storage. Used by the storage module for user-uploaded
 * documents living on a Railway volume (or any local mount in dev).
 *
 * The volume root comes from STORAGE_VOLUME_PATH. Storage keys are relative
 * paths inside that root, e.g. `{userId}/{uuid}`.
 */

import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";

import { logger } from "@repo/logs";

// Accept either a Node Readable, the Web ReadableStream from Next.js's
// `Request.body` (global type), or the Node web-stream variant. They're
// structurally compatible but TS treats them as distinct.
export type StorageWritableSource =
	| Readable
	| ReadableStream<Uint8Array>
	| NodeWebReadableStream<Uint8Array>;

function getVolumeRoot(): string {
	const path = process.env.STORAGE_VOLUME_PATH;
	if (!path) {
		throw new Error("Missing env variable STORAGE_VOLUME_PATH");
	}
	return resolve(path);
}

/**
 * Resolve a storage key to its absolute path on disk, with traversal guard:
 * the resolved path must stay under the volume root.
 */
export function getStorageFilePath(key: string): string {
	const root = getVolumeRoot();
	const target = resolve(root, key);
	if (!target.startsWith(`${root}/`) && target !== root) {
		throw new Error("Invalid storage key");
	}
	return target;
}

export async function writeStreamToVolume(
	key: string,
	body: StorageWritableSource,
): Promise<{ size: number }> {
	const filePath = getStorageFilePath(key);
	await mkdir(dirname(filePath), { recursive: true });

	const writeStream = createWriteStream(filePath);
	const nodeStream =
		body instanceof Readable
			? body
			: Readable.fromWeb(body as NodeWebReadableStream<Uint8Array>);

	let bytes = 0;
	nodeStream.on("data", (chunk: Buffer) => {
		bytes += chunk.byteLength;
	});

	try {
		await new Promise<void>((resolveDone, reject) => {
			nodeStream.on("error", reject);
			writeStream.on("error", reject);
			writeStream.on("finish", () => resolveDone());
			nodeStream.pipe(writeStream);
		});
	} catch (e) {
		writeStream.destroy();
		await unlink(filePath).catch(() => {});
		throw e;
	}

	return { size: bytes };
}

export function readVolumeFileStream(key: string): Readable {
	return createReadStream(getStorageFilePath(key));
}

export async function deleteVolumeFile(key: string): Promise<void> {
	const filePath = getStorageFilePath(key);
	try {
		await unlink(filePath);
	} catch (e) {
		const code = (e as NodeJS.ErrnoException).code;
		if (code !== "ENOENT") {
			logger.error({ key, err: e }, "Volume delete failed");
			throw e;
		}
	}
}

export async function getVolumeFileStat(
	key: string,
): Promise<{ size: number } | null> {
	try {
		const s = await stat(getStorageFilePath(key));
		return { size: s.size };
	} catch {
		return null;
	}
}

/** Resolve where the volume actually lives - useful for diagnostics only. */
export function describeVolume(): { root: string } {
	return { root: getVolumeRoot() };
}

// Internal join used by tests.
export const _internal = { join };
