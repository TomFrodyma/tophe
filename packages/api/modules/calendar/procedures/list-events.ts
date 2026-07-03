import { listCalendarEventsInRange } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { expandEvents } from "../lib/recurrence";

export const listEvents = protectedProcedure
	.route({
		method: "GET",
		path: "/calendar/events",
		tags: ["Calendar"],
		summary: "List calendar events",
		description:
			"Returns expanded occurrences for the authenticated user within [from, to).",
	})
	.input(
		z.object({
			from: z.coerce.date(),
			to: z.coerce.date(),
		}),
	)
	.handler(async ({ input: { from, to }, context: { user } }) => {
		const rows = await listCalendarEventsInRange(user.id, from, to);
		const occurrences = expandEvents(rows, from, to);
		return occurrences.map((o) => ({
			id: o.id,
			eventId: o.eventId,
			title: o.title,
			description: o.description,
			location: o.location,
			startAt: o.startAt,
			endAt: o.endAt,
			allDay: o.allDay,
			color: o.color,
			icon: o.icon,
			isRecurring: o.isRecurring,
			recurrenceRule: o.recurrenceRule,
			occurrenceStart: o.occurrenceStart,
			source: o.source,
		}));
	});
