import { z } from "zod";

export const taskStatusSchema = z.enum(["OPEN", "DONE"]);
export type TaskStatusValue = z.infer<typeof taskStatusSchema>;

export const taskInputSchema = z.object({
	title: z.string().min(1, "Title is required").max(500),
	notes: z.string().max(10_000).nullish(),
	dueDate: z.coerce.date().nullish(),
});

export type TaskInput = z.infer<typeof taskInputSchema>;

export const taskUpdateSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1).max(500).optional(),
	notes: z.string().max(10_000).nullish(),
	dueDate: z.coerce.date().nullish(),
	status: taskStatusSchema.optional(),
});

export type TaskUpdate = z.infer<typeof taskUpdateSchema>;
