import { type JournalMood, listJournalEntriesForUser } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { journalMoodSchema } from "../types";

export const listEntries = protectedProcedure
	.route({
		method: "GET",
		path: "/journal",
		tags: ["Journal"],
		summary: "List journal entries",
		description: "Returns the authenticated user's journal entries, newest first.",
	})
	.input(
		z.object({
			take: z.number().int().min(1).max(200).optional(),
			search: z.string().max(200).optional(),
			mood: journalMoodSchema.nullish(),
			onlyDaily: z.boolean().optional(),
			from: z.coerce.date().optional(),
			to: z.coerce.date().optional(),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const entries = await listJournalEntriesForUser(user.id, input.take ?? 100, {
			search: input.search,
			mood: (input.mood ?? undefined) as JournalMood | undefined,
			onlyDaily: input.onlyDaily,
			from: input.from,
			to: input.to,
		});
		return entries.map((entry) => ({
			id: entry.id,
			title: entry.title,
			content: entry.content,
			mood: entry.mood as string | null,
			isDaily: entry.isDaily,
			createdAt: entry.createdAt,
			updatedAt: entry.updatedAt,
		}));
	});
