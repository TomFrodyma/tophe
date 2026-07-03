import { updateCalendarEvent } from "@repo/database";
import { ORPCError } from "@orpc/server";

import { protectedProcedure } from "../../../orpc/procedures";
import { calendarEventUpdateSchema } from "../types";

export const updateEvent = protectedProcedure
	.route({
		method: "PUT",
		path: "/calendar/events/{id}",
		tags: ["Calendar"],
		summary: "Update a calendar event",
	})
	.input(calendarEventUpdateSchema)
	.handler(async ({ input, context: { user } }) => {
		if (input.startAt && input.endAt && input.endAt.getTime() < input.startAt.getTime()) {
			throw new ORPCError("BAD_REQUEST", { message: "End must be after start" });
		}
		const count = await updateCalendarEvent({
			id: input.id,
			userId: user.id,
			title: input.title,
			description: input.description,
			location: input.location,
			startAt: input.startAt,
			endAt: input.endAt,
			allDay: input.allDay,
			color: input.color,
			icon: input.icon,
			rrule: input.rrule,
			reminderMinutes: input.reminderMinutes,
		});
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const };
	});
