import { getJournalEntryForUser } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const getEntry = protectedProcedure
	.route({
		method: "GET",
		path: "/journal/{id}",
		tags: ["Journal"],
		summary: "Get a journal entry",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input: { id }, context: { user } }) => {
		const entry = await getJournalEntryForUser(id, user.id);
		if (!entry) {
			throw new ORPCError("NOT_FOUND");
		}
		return {
			id: entry.id,
			title: entry.title,
			content: entry.content,
			mood: entry.mood as string | null,
			createdAt: entry.createdAt,
			updatedAt: entry.updatedAt,
		};
	});
