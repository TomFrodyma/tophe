import { deleteCalendarIntegration } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";

export const deleteIntegration = protectedProcedure
	.route({
		method: "DELETE",
		path: "/calendar/integrations/outlook",
		tags: ["Calendar"],
		summary: "Disconnect the Outlook calendar and remove synced events",
	})
	.handler(async ({ context: { user } }) => {
		const count = await deleteCalendarIntegration(user.id, "OUTLOOK_ICS");
		return { ok: true as const, removed: count > 0 };
	});
