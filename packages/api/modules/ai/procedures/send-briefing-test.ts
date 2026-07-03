import { protectedProcedure } from "../../../orpc/procedures";
import { sendBriefingTestNotification } from "../lib/briefing";

export const sendBriefingTest = protectedProcedure
	.route({
		method: "POST",
		path: "/ai/briefing/test-notification",
		tags: ["AI"],
		summary: "Send a test of the daily-briefing notification to the current user",
	})
	.handler(async ({ context: { user } }) => {
		await sendBriefingTestNotification(user.id);
		return { ok: true as const };
	});
