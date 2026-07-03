import { getNoteForUser } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const getNote = protectedProcedure
	.route({
		method: "GET",
		path: "/notes/{id}",
		tags: ["Notes"],
		summary: "Get a note",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input: { id }, context: { user } }) => {
		const note = await getNoteForUser(id, user.id);
		if (!note) {
			throw new ORPCError("NOT_FOUND");
		}
		return {
			id: note.id,
			title: note.title,
			content: note.content,
			remindAt: note.remindAt,
			createdAt: note.createdAt,
			updatedAt: note.updatedAt,
		};
	});
