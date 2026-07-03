import { z } from "zod";

export const journalMoodSchema = z.enum(["GREAT", "GOOD", "OKAY", "LOW", "BAD"]);

export type JournalMoodValue = z.infer<typeof journalMoodSchema>;

export const journalEntryInputSchema = z.object({
	title: z.string().min(1, "Title is required").max(200),
	content: z.string().min(1, "Content is required").max(50_000),
	mood: journalMoodSchema.nullish(),
	// The day the entry is for. Stored as createdAt (the journal's day anchor),
	// so an entry written after midnight can be filed under the right day.
	date: z.coerce.date().optional(),
});

export type JournalEntryInput = z.infer<typeof journalEntryInputSchema>;
