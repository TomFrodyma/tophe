import { type JournalMood, updateJournalEntry } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { journalMoodSchema } from "../types";

export const updateEntry = protectedProcedure
	.route({
		method: "PUT",
		path: "/journal/{id}",
		tags: ["Journal"],
		summary: "Update a journal entry",
	})
	.input(
		z.object({
			id: z.string().min(1),
			title: z.string().min(1).max(200).optional(),
			content: z.string().min(1).max(50_000).optional(),
			mood: journalMoodSchema.nullish(),
			date: z.coerce.date().optional(),
		}),
	)
	.handler(async ({ input: { id, title, content, mood, date }, context: { user } }) => {
		const count = await updateJournalEntry({
			id,
			userId: user.id,
			title,
			content,
			mood: mood === undefined ? undefined : ((mood ?? null) as JournalMood | null),
			createdAt: date,
		});
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const };
	});
