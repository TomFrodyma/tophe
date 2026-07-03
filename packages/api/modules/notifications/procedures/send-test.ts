import { createNotification } from "@repo/notifications";

import { protectedProcedure } from "../../../orpc/procedures";

/**
 * Sends a notification to the calling user. Useful for verifying that
 * in-app delivery, the sound, and email templates all work end-to-end.
 *
 * Reuses the `APP_UPDATE` type so no schema migration is required. The
 * user's notification preferences are respected - if they've disabled
 * in-app or email for `APP_UPDATE`, the corresponding path is skipped.
 */
export const sendTestNotification = protectedProcedure
	.route({
		method: "POST",
		path: "/notifications/send-test",
		tags: ["Notifications"],
		summary: "Send a test notification to the current user",
	})
	.handler(async ({ context: { user } }) => {
		await createNotification({
			userId: user.id,
			type: "APP_UPDATE",
			data: {
				headline: "Test notification",
				title: "Test notification",
				message:
					"If you can see this, in-app notifications are working. Check your inbox for the matching email.",
			},
		});
		return { ok: true };
	});
