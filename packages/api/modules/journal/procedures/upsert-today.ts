import { findOrCreateTodayJournalEntry } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const upsertToday = protectedProcedure
	.route({
		method: "POST",
		path: "/journal/today",
		tags: ["Journal"],
		summary: "Get or create today's daily journal entry",
	})
	.input(
		z.object({
			title: z.string().min(1).max(200),
		}),
	)
	.handler(async ({ input: { title }, context: { user } }) => {
		const entry = await findOrCreateTodayJournalEntry({ userId: user.id, title });
		return { id: entry.id };
	});
