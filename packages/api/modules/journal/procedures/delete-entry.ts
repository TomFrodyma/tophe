import { deleteJournalEntry } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const deleteEntry = protectedProcedure
	.route({
		method: "DELETE",
		path: "/journal/{id}",
		tags: ["Journal"],
		summary: "Delete a journal entry",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input: { id }, context: { user } }) => {
		const count = await deleteJournalEntry(id, user.id);
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const };
	});
