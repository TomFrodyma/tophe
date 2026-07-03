import { z } from "zod";

export const noteInputSchema = z.object({
	title: z.string().min(1, "Title is required").max(200),
	content: z.string().max(50_000).optional().default(""),
	remindAt: z.coerce.date().nullish(),
});

export type NoteInput = z.infer<typeof noteInputSchema>;
