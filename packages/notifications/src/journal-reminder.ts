import { db } from "@repo/database";

import { createNotification } from "./create-notification";
import { DEFAULT_TIMEZONE, getUserLocalInfo } from "./tz";

const REMINDER_HOUR = 20;

interface EnsureJournalDailyReminderOptions {
	userId: string;
	/** Current date/time to evaluate against - defaults to `new Date()`. */
	now?: Date;
	/** Hour of day (0–23) in the user's timezone at which the reminder becomes eligible. Defaults to 20 (8pm). */
	afterHour?: number;
}

/**
 * Creates a journal daily-reminder notification for the user if, in their local timezone:
 *   - the local hour is at or past `afterHour` (default 8pm)
 *   - they have no journal entry created today
 *   - no reminder notification was already created today
 *
 * Idempotent - safe to call repeatedly.
 */
export async function ensureJournalDailyReminder({
	userId,
	now = new Date(),
	afterHour = REMINDER_HOUR,
}: EnsureJournalDailyReminderOptions) {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { timezone: true },
	});
	const timezone = user?.timezone || DEFAULT_TIMEZONE;
	const { hour, startOfDay, endOfDay } = getUserLocalInfo(now, timezone);
	if (hour < afterHour) return null;

	const entryToday = await db.journalEntry.findFirst({
		where: {
			userId,
			createdAt: { gte: startOfDay, lt: endOfDay },
		},
		select: { id: true },
	});
	if (entryToday) return null;

	const existingReminder = await db.notification.findFirst({
		where: {
			userId,
			type: "JOURNAL_DAILY_REMINDER",
			createdAt: { gte: startOfDay, lt: endOfDay },
		},
		select: { id: true },
	});
	if (existingReminder) return null;

	return await createNotification({
		userId,
		type: "JOURNAL_DAILY_REMINDER",
		link: "/journal",
		data: {
			title: "Write today's entry",
			message: "You haven't journaled yet today. A few words are enough.",
			headline: "Write today's entry",
		},
	});
}
