import { protectedProcedure } from "../../../orpc/procedures";
import { ensureDailyBriefingForUser } from "../lib/briefing";

export const getDailyBriefing = protectedProcedure
	.route({
		method: "GET",
		path: "/ai/briefing",
		tags: ["AI"],
		summary: "The user's daily briefing: their day plus news picked and explained for them",
	})
	.handler(async ({ context: { user } }) => {
		return ensureDailyBriefingForUser(user.id, new Date());
	});
