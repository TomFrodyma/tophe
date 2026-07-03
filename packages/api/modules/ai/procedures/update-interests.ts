import { clearDailyBriefing, updateAgentInterests } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { DEFAULT_CORE_PROFILE, DEFAULT_PERSONA } from "../lib/agent-prompt";
import { newsFeedListSchema } from "../lib/news-feeds";

export const updateInterests = protectedProcedure
	.route({
		method: "PUT",
		path: "/ai/interests",
		tags: ["AI"],
		summary: "Update the briefing interests (what news to surface)",
	})
	.input(
		z.object({
			interests: z.string().max(4000),
			// Omitted = leave as is; [] = follow the curated default set.
			newsFeeds: newsFeedListSchema.optional(),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		// Dedupe by url so a source can't be listed twice.
		const newsFeeds = input.newsFeeds?.filter(
			(f, i, all) => all.findIndex((o) => o.url === f.url) === i,
		);
		await updateAgentInterests(
			user.id,
			input.interests.trim(),
			{
				personaPrompt: DEFAULT_PERSONA,
				coreProfile: DEFAULT_CORE_PROFILE,
			},
			newsFeeds,
		);
		// Regenerate today's paper with the new interests rather than serving the
		// cached one built from the old ones.
		await clearDailyBriefing(user.id);
		return { ok: true as const };
	});
