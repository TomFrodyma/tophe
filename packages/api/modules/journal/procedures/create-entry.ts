import { createJournalEntry, type JournalMood } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { journalEntryInputSchema } from "../types";

export const createEntry = protectedProcedure
	.route({
		method: "POST",
		path: "/journal",
		tags: ["Journal"],
		summary: "Create a journal entry",
	})
	.input(journalEntryInputSchema)
	.handler(async ({ input: { title, content, mood, date }, context: { user } }) => {
		const entry = await createJournalEntry({
			userId: user.id,
			title,
			content,
			mood: (mood ?? null) as JournalMood | null,
			createdAt: date,
		});
		return {
			id: entry.id,
			title: entry.title,
			content: entry.content,
			mood: entry.mood as string | null,
			createdAt: entry.createdAt,
			updatedAt: entry.updatedAt,
		};
	});
