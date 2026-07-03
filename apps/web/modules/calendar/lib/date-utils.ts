import {
	addDays,
	addMonths,
	endOfDay,
	endOfMonth,
	endOfWeek,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "date-fns";

export type CalendarView = "MONTH" | "DAY" | "AGENDA";

const WEEK_OPTS = { weekStartsOn: 1 as const };

export function getMonthGridRange(date: Date) {
	const from = startOfWeek(startOfMonth(date), WEEK_OPTS);
	const to = endOfWeek(endOfMonth(date), WEEK_OPTS);
	return { from: startOfDay(from), to: endOfDay(to) };
}

export function getMonthGridDays(date: Date): Date[] {
	const { from, to } = getMonthGridRange(date);
	const days: Date[] = [];
	for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) {
		days.push(cursor);
	}
	return days;
}

export function getDayRange(date: Date) {
	return { from: startOfDay(date), to: endOfDay(date) };
}

export function getAgendaRange(date: Date, weeksAhead = 8) {
	const from = startOfDay(date);
	const to = endOfDay(addDays(startOfDay(date), weeksAhead * 7));
	return { from, to };
}

export function getNextRange(view: CalendarView, date: Date): Date {
	if (view === "MONTH") return addMonths(date, 1);
	if (view === "DAY") return addDays(date, 1);
	return addDays(date, 7);
}

export function getPrevRange(view: CalendarView, date: Date): Date {
	if (view === "MONTH") return addMonths(date, -1);
	if (view === "DAY") return addDays(date, -1);
	return addDays(date, -7);
}

export function isSameLocalDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

export function overlapsDay(day: Date, start: Date, end: Date): boolean {
	const dayStart = startOfDay(day).getTime();
	const dayEnd = endOfDay(day).getTime();
	return end.getTime() > dayStart && start.getTime() < dayEnd;
}

/**
 * Convert a `YYYY-MM-DDTHH:mm` local datetime-local input value to a Date.
 * Using `new Date(s)` on such a string returns a local-time Date by spec.
 */
export function parseLocalInput(value: string): Date | null {
	if (!value) return null;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}

export function toLocalInputValue(date: Date, allDay = false): string {
	const pad = (n: number) => n.toString().padStart(2, "0");
	const y = date.getFullYear();
	const m = pad(date.getMonth() + 1);
	const d = pad(date.getDate());
	if (allDay) return `${y}-${m}-${d}`;
	const hh = pad(date.getHours());
	const mm = pad(date.getMinutes());
	return `${y}-${m}-${d}T${hh}:${mm}`;
}
