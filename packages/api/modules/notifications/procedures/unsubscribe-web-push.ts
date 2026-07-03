import { db } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

/**
 * Removes a Web Push subscription for the current user (they turned it off, or
 * the browser dropped it). Scoped to the caller's `userId`, so one user can never
 * delete another's subscription.
 */
export const unsubscribeWebPush = protectedProcedure
	.route({
		method: "POST",
		path: "/notifications/web-push/unsubscribe",
		tags: ["Notifications"],
		summary: "Remove a Web Push subscription",
	})
	.input(z.object({ endpoint: z.string().url() }))
	.handler(async ({ input: { endpoint }, context: { user } }) => {
		await db.webPushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
		return { ok: true as const };
	});
