export type CalendarEventSource = "MANUAL" | "OUTLOOK_ICS";

export interface CalendarOccurrence {
	id: string;
	eventId: string;
	title: string;
	description: string | null;
	location: string | null;
	startAt: Date | string;
	endAt: Date | string;
	allDay: boolean;
	color: string;
	icon: string | null;
	isRecurring: boolean;
	recurrenceRule: string | null;
	occurrenceStart: Date | string;
	source: string;
}

export function isManualSource(source: string): boolean {
	return source === "MANUAL";
}
