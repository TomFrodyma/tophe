import { rrulestr } from "rrule";

export interface EventRow {
	id: string;
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
	source: string;
}

export interface EventOccurrence {
	id: string;
	eventId: string;
	title: string;
	description: string | null;
	location: string | null;
	startAt: Date;
	endAt: Date;
	allDay: boolean;
	color: string;
	icon: string | null;
	isRecurring: boolean;
	recurrenceRule: string | null;
	occurrenceStart: Date;
	source: string;
}

const HARD_EXPANSION_CAP = 500;

function parseRule(ruleString: string, dtstart: Date) {
	try {
		return rrulestr(ruleString, { dtstart });
	} catch {
		return null;
	}
}

function datesEqual(a: Date, b: Date) {
	return a.getTime() === b.getTime();
}

function isExcluded(date: Date, excludedDates: Date[]) {
	return excludedDates.some((ex) => datesEqual(new Date(ex), date));
}

export function expandEvent(event: EventRow, from: Date, to: Date): EventOccurrence[] {
	const durationMs = Math.max(0, event.endAt.getTime() - event.startAt.getTime());

	if (!event.rrule) {
		if (event.startAt.getTime() >= to.getTime() || event.endAt.getTime() <= from.getTime()) {
			return [];
		}
		return [
			{
				id: event.id,
				eventId: event.id,
				title: event.title,
				description: event.description,
				location: event.location,
				startAt: event.startAt,
				endAt: event.endAt,
				allDay: event.allDay,
				color: event.color,
				icon: event.icon,
				isRecurring: false,
				recurrenceRule: null,
				occurrenceStart: event.startAt,
				source: event.source,
			},
		];
	}

	const rule = parseRule(event.rrule, event.startAt);
	if (!rule) return [];

	// Include occurrences whose start could still overlap the window
	const lookbackStart = new Date(from.getTime() - durationMs);
	const starts = rule
		.between(lookbackStart, to, true)
		.slice(0, HARD_EXPANSION_CAP);

	const occurrences: EventOccurrence[] = [];
	for (const occStart of starts) {
		if (isExcluded(occStart, event.excludedDates)) continue;
		const occEnd = new Date(occStart.getTime() + durationMs);
		if (occEnd.getTime() <= from.getTime()) continue;
		occurrences.push({
			id: `${event.id}__${occStart.toISOString()}`,
			eventId: event.id,
			title: event.title,
			description: event.description,
			location: event.location,
			startAt: occStart,
			endAt: occEnd,
			allDay: event.allDay,
			color: event.color,
			icon: event.icon,
			isRecurring: true,
			recurrenceRule: event.rrule,
			occurrenceStart: occStart,
			source: event.source,
		});
	}
	return occurrences;
}

export function expandEvents(events: EventRow[], from: Date, to: Date): EventOccurrence[] {
	return events
		.flatMap((event) => expandEvent(event, from, to))
		.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}
