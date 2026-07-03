import { db } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

/**
 * Stores a browser / PWA Web Push subscription for the current user. Called from
 * the client after the user opts in and the browser hands back a PushSubscription.
 * Idempotent: `endpoint` is unique, so re-subscribing the same browser re-points
 * it at the current user and refreshes its keys. Only the signed-in user can
 * register a subscription, and it is always scoped to their `userId`.
 */
export const subscribeWebPush = protectedProcedure
	.route({
		method: "POST",
		path: "/notifications/web-push/subscribe",
		tags: ["Notifications"],
		summary: "Store a Web Push subscription",
	})
	.input(
		z.object({
			endpoint: z.string().url(),
			keys: z.object({
				p256dh: z.string().min(1),
				auth: z.string().min(1),
			}),
			userAgent: z.string().max(512).optional(),
		}),
	)
	.handler(async ({ input: { endpoint, keys, userAgent }, context: { user } }) => {
		await db.webPushSubscription.upsert({
			where: { endpoint },
			create: { userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent },
			update: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth, userAgent },
		});
		return { ok: true as const };
	});
