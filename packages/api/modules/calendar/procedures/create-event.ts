import { createCalendarEvent } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { calendarEventInputSchema } from "../types";

export const createEvent = protectedProcedure
	.route({
		method: "POST",
		path: "/calendar/events",
		tags: ["Calendar"],
		summary: "Create a calendar event",
	})
	.input(calendarEventInputSchema)
	.handler(async ({ input, context: { user } }) => {
		const event = await createCalendarEvent({
			userId: user.id,
			title: input.title,
			description: input.description ?? null,
			location: input.location ?? null,
			startAt: input.startAt,
			endAt: input.endAt,
			allDay: input.allDay ?? false,
			color: input.color ?? "sky",
			icon: input.icon ?? null,
			rrule: input.rrule ?? null,
			reminderMinutes: input.reminderMinutes ?? null,
		});
		return { id: event.id };
	});
