import { db } from "@repo/database";
import { rrulestr } from "rrule";

import { createNotification } from "./create-notification";

/**
 * Options for a single reminder offset the user can choose from. Null = no reminder.
 */
export const CALENDAR_REMINDER_OPTIONS = [5, 15, 30, 60, 1440] as const;
export type CalendarReminderOption = (typeof CALENDAR_REMINDER_OPTIONS)[number];

/** How far back a missed cron run can be recovered (prevents spamming old reminders). */
const LOOKBACK_MS = 15 * 60 * 1000;
/** Cap on how far ahead to look for reminders (matches max option: 1 day). */
const MAX_LOOKAHEAD_MS = 24 * 60 * 60 * 1000 + 60 * 60 * 1000;
/** Hard cap on notifications per run. Guards against runaway bugs. */
const SAFETY_CAP = 100;

interface EventLike {
	id: string;
	userId: string;
	title: string;
	location: string | null;
	startAt: Date;
	endAt: Date;
	rrule: string | null;
	excludedDates: Date[];
	reminderMinutes: number | null;
	user: { timezone: string | null };
}

function collectOccurrences(event: EventLike, from: Date, to: Date): Date[] {
	if (!event.rrule) {
		if (event.startAt.getTime() < from.getTime() || event.startAt.getTime() > to.getTime()) {
			return [];
		}
		return [event.startAt];
	}
	try {
		const rule = rrulestr(event.rrule, { dtstart: event.startAt });
		const excluded = new Set(event.excludedDates.map((d) => new Date(d).getTime()));
		return rule
			.between(from, to, true)
			.filter((d) => !excluded.has(d.getTime()))
			.slice(0, 50);
	} catch {
		return [];
	}
}

function formatReminderMessage(event: EventLike, occStart: Date): string {
	const timeZone = event.user.timezone ?? undefined;
	const timeText = occStart.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		timeZone,
	});
	const base = `Starts at ${timeText}.`;
	return event.location ? `${base} ${event.location}` : base;
}

/**
 * Scans all users' manual calendar events for reminders that should fire now.
 * Idempotent - safe to call repeatedly from a cron.
 *
 * Rules:
 *   - Only `MANUAL` events with `reminderMinutes != null`
 *   - Fires once per `(eventId, occurrenceStart)` pair
 *   - Skips occurrences that already started (> 1 minute ago)
 *   - Bails after {@link SAFETY_CAP} notifications to guard against runaway
 */
export async function ensureCalendarEventReminders(
	now: Date = new Date(),
): Promise<{ checked: number; created: number; capped: boolean }> {
	const lookbackFrom = new Date(now.getTime() - LOOKBACK_MS);
	const lookaheadTo = new Date(now.getTime() + MAX_LOOKAHEAD_MS);

	const events = await db.calendarEvent.findMany({
		where: {
			source: "MANUAL",
			reminderMinutes: { not: null },
			OR: [
				{ rrule: { not: null } },
				{
					AND: [
						{ startAt: { lt: lookaheadTo } },
						{ startAt: { gt: lookbackFrom } },
					],
				},
			],
		},
		include: {
			user: { select: { timezone: true } },
		},
	});

	if (events.length === 0) {
		return { checked: 0, created: 0, capped: false };
	}

	const recentReminders = await db.notification.findMany({
		where: {
			type: "CALENDAR_EVENT_REMINDER",
			createdAt: { gte: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
		},
		select: { data: true, userId: true },
	});
	const alreadySent = new Set<string>();
	for (const r of recentReminders) {
		if (!r.data || typeof r.data !== "object" || Array.isArray(r.data)) continue;
		const d = r.data as { eventId?: unknown; occurrenceAt?: unknown };
		if (typeof d.eventId === "string" && typeof d.occurrenceAt === "string") {
			alreadySent.add(`${r.userId}|${d.eventId}|${d.occurrenceAt}`);
		}
	}

	let created = 0;
	let capped = false;

	for (const event of events) {
		if (event.reminderMinutes == null) continue;

		const occurrences = collectOccurrences(event, lookbackFrom, lookaheadTo);

		for (const occStart of occurrences) {
			const fireAt = occStart.getTime() - event.reminderMinutes * 60 * 1000;
			const elapsed = now.getTime() - fireAt;
			if (elapsed < 0 || elapsed > LOOKBACK_MS) continue;
			if (occStart.getTime() < now.getTime() - 60 * 1000) continue;

			const key = `${event.userId}|${event.id}|${occStart.toISOString()}`;
			if (alreadySent.has(key)) continue;

			if (created >= SAFETY_CAP) {
				capped = true;
				return { checked: events.length, created, capped };
			}

			await createNotification({
				userId: event.userId,
				type: "CALENDAR_EVENT_REMINDER",
				link: "/calendar",
				data: {
					eventId: event.id,
					occurrenceAt: occStart.toISOString(),
					title: event.title,
					message: formatReminderMessage(event, occStart),
					headline: event.title,
				},
			});
			alreadySent.add(key);
			created++;
		}
	}

	return { checked: events.length, created, capped };
}
