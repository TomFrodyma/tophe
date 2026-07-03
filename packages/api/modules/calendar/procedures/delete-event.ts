import { addCalendarEventException, deleteCalendarEvent } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const deleteEvent = protectedProcedure
	.route({
		method: "DELETE",
		path: "/calendar/events/{id}",
		tags: ["Calendar"],
		summary: "Delete a calendar event or a single occurrence",
	})
	.input(
		z.object({
			id: z.string().min(1),
			occurrenceStart: z.coerce.date().nullish(),
		}),
	)
	.handler(async ({ input: { id, occurrenceStart }, context: { user } }) => {
		if (occurrenceStart) {
			const count = await addCalendarEventException(id, user.id, occurrenceStart);
			if (count === 0) {
				throw new ORPCError("NOT_FOUND");
			}
			return { ok: true as const, mode: "occurrence" as const };
		}
		const count = await deleteCalendarEvent(id, user.id);
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const, mode: "series" as const };
	});
