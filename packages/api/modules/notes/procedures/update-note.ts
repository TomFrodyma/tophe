import { updateNote } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const updateNoteProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/notes/{id}",
		tags: ["Notes"],
		summary: "Update a note",
	})
	.input(
		z.object({
			id: z.string().min(1),
			title: z.string().min(1).max(200).optional(),
			content: z.string().max(50_000).optional(),
			remindAt: z.coerce.date().nullish(),
			pinned: z.boolean().optional(),
		}),
	)
	.handler(async ({ input: { id, title, content, remindAt, pinned }, context: { user } }) => {
		const count = await updateNote({
			id,
			userId: user.id,
			title,
			content,
			remindAt: remindAt === undefined ? undefined : (remindAt ?? null),
			// Fresh pins get 0 so they top the pinned section until dragged.
			pinOrder: pinned === undefined ? undefined : pinned ? 0 : null,
		});
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const };
	});
