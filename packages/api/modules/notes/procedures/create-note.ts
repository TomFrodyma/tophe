import { createNote } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { noteInputSchema } from "../types";

export const createNoteProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/notes",
		tags: ["Notes"],
		summary: "Create a note",
	})
	.input(noteInputSchema)
	.handler(async ({ input: { title, content, remindAt }, context: { user } }) => {
		const note = await createNote({
			userId: user.id,
			title,
			content: content ?? "",
			remindAt: remindAt ?? null,
		});
		return {
			id: note.id,
			title: note.title,
			content: note.content,
			remindAt: note.remindAt,
			createdAt: note.createdAt,
			updatedAt: note.updatedAt,
		};
	});
