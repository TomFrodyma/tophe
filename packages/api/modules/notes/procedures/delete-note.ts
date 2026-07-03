import { deleteNote } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const deleteNoteProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/notes/{id}",
		tags: ["Notes"],
		summary: "Delete a note",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input: { id }, context: { user } }) => {
		const count = await deleteNote(id, user.id);
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const };
	});
