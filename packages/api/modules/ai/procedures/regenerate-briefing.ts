import { clearDailyBriefing } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { ensureDailyBriefingForUser } from "../lib/briefing";

export const regenerateBriefing = protectedProcedure
	.route({
		method: "POST",
		path: "/ai/briefing/regenerate",
		tags: ["AI"],
		summary: "Discard today's cached briefing and build a fresh one",
	})
	.handler(async ({ context: { user } }) => {
		await clearDailyBriefing(user.id);
		return ensureDailyBriefingForUser(user.id, new Date());
	});
