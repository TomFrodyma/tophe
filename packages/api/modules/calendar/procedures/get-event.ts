import { getCalendarEventForUser } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const getEvent = protectedProcedure
	.route({
		method: "GET",
		path: "/calendar/events/{id}",
		tags: ["Calendar"],
		summary: "Get a calendar event",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input: { id }, context: { user } }) => {
		const event = await getCalendarEventForUser(id, user.id);
		if (!event) {
			throw new ORPCError("NOT_FOUND");
		}
		return {
			id: event.id,
			title: event.title,
			description: event.description,
			location: event.location,
			startAt: event.startAt,
			endAt: event.endAt,
			allDay: event.allDay,
			color: event.color,
			icon: event.icon,
			rrule: event.rrule,
			reminderMinutes: event.reminderMinutes,
			excludedDates: event.excludedDates,
			source: event.source,
			createdAt: event.createdAt,
			updatedAt: event.updatedAt,
		};
	});
