import { z } from "zod";

export const goalTypeSchema = z.enum(["NUMERIC", "BOOLEAN", "MILESTONE"]);
export type GoalTypeValue = z.infer<typeof goalTypeSchema>;

export const goalStatusSchema = z.enum([
	"ACTIVE",
	"COMPLETED",
	"PAUSED",
	"ARCHIVED",
]);
export type GoalStatusValue = z.infer<typeof goalStatusSchema>;

export const goalCadenceSchema = z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]);
export type GoalCadenceValue = z.infer<typeof goalCadenceSchema>;

export const goalHorizonSchema = z.enum(["LONG_TERM", "PROJECT", "HABIT"]);
export type GoalHorizonValue = z.infer<typeof goalHorizonSchema>;

export const goalColorSchema = z.enum([
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
export type GoalColor = z.infer<typeof goalColorSchema>;

export const goalMilestoneInputSchema = z.object({
	id: z.string().min(1).optional(),
	title: z.string().min(1, "Milestone title is required").max(200),
	order: z.number().int().min(0),
	done: z.boolean().optional(),
});

export const goalInputSchema = z
	.object({
		title: z.string().min(1, "Title is required").max(200),
		description: z.string().max(10_000).nullish(),
		type: goalTypeSchema,
		horizon: goalHorizonSchema.optional(),
		targetValue: z.number().finite().nullish(),
		unit: z.string().max(60).nullish(),
		startDate: z.coerce.date().nullish(),
		dueDate: z.coerce.date().nullish(),
		color: goalColorSchema.optional(),
		icon: z.string().max(60).nullish(),
		cadence: goalCadenceSchema.optional(),
		milestones: z.array(goalMilestoneInputSchema).max(50).optional(),
	})
	.refine(
		(v) =>
			!v.startDate ||
			!v.dueDate ||
			v.dueDate.getTime() >= v.startDate.getTime(),
		{ message: "Due date must be after start date", path: ["dueDate"] },
	)
	.refine(
		(v) =>
			v.type !== "NUMERIC" ||
			v.targetValue == null ||
			v.targetValue > 0,
		{ message: "Target must be greater than zero", path: ["targetValue"] },
	);

export type GoalInput = z.infer<typeof goalInputSchema>;

export const goalUpdateSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1).max(200).optional(),
	description: z.string().max(10_000).nullish(),
	targetValue: z.number().finite().nullish(),
	unit: z.string().max(60).nullish(),
	startDate: z.coerce.date().nullish(),
	dueDate: z.coerce.date().nullish(),
	color: goalColorSchema.optional(),
	icon: z.string().max(60).nullish(),
	cadence: goalCadenceSchema.optional(),
	horizon: goalHorizonSchema.optional(),
	status: goalStatusSchema.optional(),
	milestones: z.array(goalMilestoneInputSchema).max(50).optional(),
});

export type GoalUpdate = z.infer<typeof goalUpdateSchema>;

export const goalCheckInInputSchema = z.object({
	goalId: z.string().min(1),
	value: z.number().finite(),
	note: z.string().max(2_000).nullish(),
});

export type GoalCheckInInput = z.infer<typeof goalCheckInInputSchema>;
