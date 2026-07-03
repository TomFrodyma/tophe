import { listNotesForUser } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const listNotes = protectedProcedure
	.route({
		method: "GET",
		path: "/notes",
		tags: ["Notes"],
		summary: "List notes",
	})
	.input(
		z.object({
			take: z.number().int().min(1).max(200).optional(),
			search: z.string().max(200).optional(),
			withReminder: z.boolean().optional(),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const notes = await listNotesForUser(user.id, input.take ?? 100, {
			search: input.search,
			withReminder: input.withReminder,
		});
		return notes.map((n) => ({
			id: n.id,
			title: n.title,
			content: n.content,
			pinOrder: n.pinOrder,
			remindAt: n.remindAt,
			createdAt: n.createdAt,
			updatedAt: n.updatedAt,
		}));
	});
