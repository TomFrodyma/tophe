import crypto from "node:crypto";

import { db } from "@repo/database";
import webpush from "web-push";

/**
 * Web Push (RFC 8291) delivery to browsers and installed PWAs.
 *
 * Zero-config: the VAPID key pair is generated on first use and stored in the
 * database (one row). `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` env vars override
 * it for deployments that manage their own keys; `VAPID_SUBJECT` optionally
 * overrides the spec-required contact.
 *
 * Privacy: the payload is encrypted end-to-end with each subscription's own
 * p256dh/auth keys. Apple / Google / Mozilla only relay ciphertext they cannot
 * read - the message content never leaves us in the clear.
 */

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "https://github.com/TomFrodyma/tophe";

interface VapidKeys {
	publicKey: string;
	privateKey: string;
}

// undefined = not loaded yet; null = unavailable (DB down before first sync)
let vapid: VapidKeys | null | undefined;

/** VAPID wants base64url of the raw P-256 point (65 bytes) and scalar (32 bytes). */
function generateVapidKeys(): VapidKeys {
	const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
		namedCurve: "prime256v1",
	});
	return {
		publicKey: publicKey.export({ type: "spki", format: "der" }).subarray(-65).toString("base64url"),
		privateKey: privateKey.export({ type: "sec1", format: "der" }).subarray(7, 39).toString("base64url"),
	};
}

async function loadVapid(): Promise<VapidKeys | null> {
	if (vapid !== undefined) return vapid;

	const envPublic = process.env.VAPID_PUBLIC_KEY;
	const envPrivate = process.env.VAPID_PRIVATE_KEY;
	if (envPublic && envPrivate) {
		vapid = { publicKey: envPublic, privateKey: envPrivate };
	} else {
		let row = await db.webPushVapidKey.findUnique({ where: { id: "default" } }).catch(() => null);
		if (!row) {
			// Two instances racing on first boot: the unique id makes the loser's
			// create fail; it re-reads the winner's row.
			row = await db.webPushVapidKey
				.create({ data: { id: "default", ...generateVapidKeys() } })
				.catch(async () => await db.webPushVapidKey.findUnique({ where: { id: "default" } }).catch(() => null));
		}
		vapid = row ? { publicKey: row.publicKey, privateKey: row.privateKey } : null;
	}

	if (vapid) {
		webpush.setVapidDetails(VAPID_SUBJECT, vapid.publicKey, vapid.privateKey);
	}
	return vapid;
}

/** The public key browsers subscribe with. Generated on first call if needed. */
export async function getWebPushPublicKey(): Promise<string | null> {
	return (await loadVapid())?.publicKey ?? null;
}

function buildPayload(data: unknown, link: string | null): string {
	const obj =
		data && typeof data === "object" && !Array.isArray(data)
			? (data as Record<string, unknown>)
			: {};
	const title =
		(typeof obj.headline === "string" && obj.headline) ||
		(typeof obj.title === "string" && obj.title) ||
		"Tophe";
	const body = typeof obj.message === "string" ? obj.message : undefined;
	return JSON.stringify({ title, body, link: link ?? undefined });
}

// 404 Not Found / 410 Gone mean the subscription is permanently dead (browser
// uninstalled the PWA, cleared site data, etc.) - delete the row so the table
// self-heals, exactly like the APNs dead-token path.
const DEAD_STATUS = new Set([404, 410]);

/**
 * Sends a Web Push to every subscription of `userId`. Dead endpoints are
 * deleted. Best-effort: a failing subscription never breaks the in-app / email
 * channels running alongside it.
 */
export async function sendWebPushToUser(input: {
	userId: string;
	data?: unknown;
	link?: string | null;
}): Promise<void> {
	if (!(await loadVapid())) return;

	const subscriptions = await db.webPushSubscription.findMany({
		where: { userId: input.userId },
		select: { id: true, endpoint: true, p256dh: true, auth: true },
	});
	if (subscriptions.length === 0) return;

	const payload = buildPayload(input.data, input.link ?? null);

	await Promise.all(
		subscriptions.map(async (sub) => {
			try {
				await webpush.sendNotification(
					{ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
					payload,
				);
			} catch (error) {
				const status = (error as { statusCode?: number })?.statusCode;
				if (status && DEAD_STATUS.has(status)) {
					await db.webPushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
				}
				// Other errors (rate limits, transient push-service issues) are ignored.
			}
		}),
	);
}
