import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

function getKey(): Buffer {
	const raw = process.env.CALENDAR_INTEGRATION_SECRET;
	if (!raw) {
		throw new Error(
			"CALENDAR_INTEGRATION_SECRET is not set. Generate one with `node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"` and add it to your env.",
		);
	}
	const buf = Buffer.from(raw, "base64");
	if (buf.length !== KEY_LENGTH) {
		throw new Error(
			`CALENDAR_INTEGRATION_SECRET must decode to ${KEY_LENGTH} bytes (got ${buf.length}). Regenerate with the command above.`,
		);
	}
	return buf;
}

export interface EncryptedPayload {
	ciphertext: string;
	nonce: string;
	authTag: string;
}

export function encryptSecret(plaintext: string): EncryptedPayload {
	const key = getKey();
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGO, key, iv);
	const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
	const authTag = cipher.getAuthTag();
	return {
		ciphertext: enc.toString("base64"),
		nonce: iv.toString("base64"),
		authTag: authTag.toString("base64"),
	};
}

export function decryptSecret(payload: EncryptedPayload): string {
	const key = getKey();
	const iv = Buffer.from(payload.nonce, "base64");
	const authTag = Buffer.from(payload.authTag, "base64");
	const ciphertext = Buffer.from(payload.ciphertext, "base64");
	const decipher = createDecipheriv(ALGO, key, iv);
	decipher.setAuthTag(authTag);
	const dec = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
	return dec.toString("utf8");
}
