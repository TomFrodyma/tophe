import { db } from "../client";

export interface CalendarEventRow {
	id: string;
	userId: string;
	title: string;
	description: string | null;
	location: string | null;
	startAt: Date;
	endAt: Date;
	allDay: boolean;
	color: string;
	icon: string | null;
	rrule: string | null;
	excludedDates: Date[];
	createdAt: Date;
	updatedAt: Date;
}

export interface CalendarEventInput {
	title: string;
	description?: string | null;
	location?: string | null;
	startAt: Date;
	endAt: Date;
	allDay?: boolean;
	color?: string;
	icon?: string | null;
	rrule?: string | null;
	reminderMinutes?: number | null;
}

export async function listCalendarEventsForUser(userId: string) {
	return await db.calendarEvent.findMany({
		where: { userId },
		orderBy: { startAt: "asc" },
	});
}

/**
 * Returns the authoritative rows that might yield occurrences in [from, to).
 * - Non-recurring: the row must actually overlap the range.
 * - Recurring: return all rows for the user; expansion happens at the API layer.
 */
export async function listCalendarEventsInRange(userId: string, from: Date, to: Date) {
	return await db.calendarEvent.findMany({
		where: {
			userId,
			OR: [
				{ rrule: { not: null } },
				{
					AND: [{ startAt: { lt: to } }, { endAt: { gt: from } }],
				},
			],
		},
		orderBy: { startAt: "asc" },
	});
}

export async function getCalendarEventForUser(id: string, userId: string) {
	return await db.calendarEvent.findFirst({
		where: { id, userId },
	});
}

export async function createCalendarEvent({
	userId,
	title,
	description,
	location,
	startAt,
	endAt,
	allDay,
	color,
	icon,
	rrule,
	reminderMinutes,
}: CalendarEventInput & { userId: string }) {
	return await db.calendarEvent.create({
		data: {
			userId,
			title,
			description: description ?? null,
			location: location ?? null,
			startAt,
			endAt,
			allDay: allDay ?? false,
			color: color ?? "sky",
			icon: icon ?? null,
			rrule: rrule ?? null,
			reminderMinutes: reminderMinutes ?? null,
		},
	});
}

export async function updateCalendarEvent({
	id,
	userId,
	title,
	description,
	location,
	startAt,
	endAt,
	allDay,
	color,
	icon,
	rrule,
	reminderMinutes,
}: {
	id: string;
	userId: string;
	title?: string;
	description?: string | null;
	location?: string | null;
	startAt?: Date;
	endAt?: Date;
	allDay?: boolean;
	color?: string;
	icon?: string | null;
	rrule?: string | null;
	reminderMinutes?: number | null;
}) {
	const result = await db.calendarEvent.updateMany({
		where: { id, userId, source: "MANUAL" },
		data: {
			...(title !== undefined ? { title } : {}),
			...(description !== undefined ? { description } : {}),
			...(location !== undefined ? { location } : {}),
			...(startAt !== undefined ? { startAt } : {}),
			...(endAt !== undefined ? { endAt } : {}),
			...(allDay !== undefined ? { allDay } : {}),
			...(color !== undefined ? { color } : {}),
			...(icon !== undefined ? { icon } : {}),
			...(rrule !== undefined ? { rrule } : {}),
			...(reminderMinutes !== undefined ? { reminderMinutes } : {}),
		},
	});
	return result.count;
}

export async function deleteCalendarEvent(id: string, userId: string) {
	const result = await db.calendarEvent.deleteMany({
		where: { id, userId, source: "MANUAL" },
	});
	return result.count;
}

export async function addCalendarEventException(id: string, userId: string, occurrence: Date) {
	const existing = await db.calendarEvent.findFirst({
		where: { id, userId },
		select: { excludedDates: true, source: true },
	});
	if (!existing) return 0;
	if (existing.source !== "MANUAL") return 0;
	const next = [...existing.excludedDates, occurrence];
	const result = await db.calendarEvent.updateMany({
		where: { id, userId, source: "MANUAL" },
		data: { excludedDates: next },
	});
	return result.count;
}
