import { z } from "zod";

export const calendarColorSchema = z.enum([
	"sky",
	"indigo",
	"violet",
	"fuchsia",
	"rose",
	"amber",
	"emerald",
	"teal",
	"slate",
]);

export type CalendarColor = z.infer<typeof calendarColorSchema>;

export const CALENDAR_REMINDER_MINUTE_OPTIONS = [5, 15, 30, 60, 1440] as const;
export const calendarReminderMinutesSchema = z
	.number()
	.int()
	.refine(
		(v): v is (typeof CALENDAR_REMINDER_MINUTE_OPTIONS)[number] =>
			(CALENDAR_REMINDER_MINUTE_OPTIONS as readonly number[]).includes(v),
		{ message: "Invalid reminder offset" },
	);

export const calendarEventInputSchema = z
	.object({
		title: z.string().min(1, "Title is required").max(200),
		description: z.string().max(10_000).nullish(),
		location: z.string().max(500).nullish(),
		startAt: z.coerce.date(),
		endAt: z.coerce.date(),
		allDay: z.boolean().optional(),
		color: calendarColorSchema.optional(),
		icon: z.string().max(60).nullish(),
		rrule: z.string().max(500).nullish(),
		reminderMinutes: calendarReminderMinutesSchema.nullish(),
	})
	.refine((v) => v.endAt.getTime() >= v.startAt.getTime(), {
		message: "End must be after start",
		path: ["endAt"],
	});

export type CalendarEventInput = z.infer<typeof calendarEventInputSchema>;

export const calendarEventUpdateSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1).max(200).optional(),
	description: z.string().max(10_000).nullish(),
	location: z.string().max(500).nullish(),
	startAt: z.coerce.date().optional(),
	endAt: z.coerce.date().optional(),
	allDay: z.boolean().optional(),
	color: calendarColorSchema.optional(),
	icon: z.string().max(60).nullish(),
	rrule: z.string().max(500).nullish(),
	reminderMinutes: calendarReminderMinutesSchema.nullish(),
});

export type CalendarEventUpdate = z.infer<typeof calendarEventUpdateSchema>;
