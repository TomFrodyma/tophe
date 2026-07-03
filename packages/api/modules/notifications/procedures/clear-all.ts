import { clearAllNotificationsForUser } from "@repo/notifications";

import { protectedProcedure } from "../../../orpc/procedures";

export const clearAllNotifications = protectedProcedure
	.route({
		method: "POST",
		path: "/notifications/clear-all",
		tags: ["Notifications"],
		summary: "Delete all of the current user's notifications",
	})
	.handler(async ({ context: { user } }) => {
		const result = await clearAllNotificationsForUser(user.id);
		return { count: result.count };
	});
