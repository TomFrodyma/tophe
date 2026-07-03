import { z } from "zod";

export const CAREER_ROLE_KINDS = ["EMPLOYMENT", "FREELANCE", "EDUCATION", "OTHER"] as const;

export const SALARY_BASES = ["NET", "GROSS"] as const;

export const SALARY_PERIODS = ["MONTHLY", "YEARLY"] as const;

export const SKILL_LEVELS = ["LEARNING", "WORKING", "STRONG", "EXPERT"] as const;

export const NEXT_STEP_TIMEFRAMES = ["NOW", "SHORT_TERM", "LONG_TERM"] as const;

export const highlightInputSchema = z.object({
	text: z.string().min(1).max(500),
	metric: z.string().max(80).nullish(),
	sortIndex: z.number().int().optional(),
});

export const salaryInputSchema = z.object({
	effectiveDate: z.coerce.date(),
	amount: z.union([z.number(), z.string()]).transform((v) => String(v)),
	currency: z.string().max(8).optional(),
	basis: z.enum(SALARY_BASES).optional(),
	period: z.enum(SALARY_PERIODS).optional(),
	label: z.string().max(120).nullish(),
});

export const roleInputSchema = z.object({
	company: z.string().min(1).max(160),
	title: z.string().min(1).max(160),
	kind: z.enum(CAREER_ROLE_KINDS).optional(),
	location: z.string().max(160).nullish(),
	startDate: z.coerce.date(),
	endDate: z.coerce.date().nullish(),
	summary: z.string().max(4_000).nullish(),
	color: z.string().max(40).optional(),
	icon: z.string().max(60).nullish(),
	sortIndex: z.number().int().optional(),
	highlights: z.array(highlightInputSchema).max(30).optional(),
	salaries: z.array(salaryInputSchema).max(30).optional(),
});

export const skillInputSchema = z.object({
	name: z.string().min(1).max(80),
	category: z.string().min(1).max(80),
	level: z.enum(SKILL_LEVELS).nullish(),
	sortIndex: z.number().int().optional(),
});

export const nextStepInputSchema = z.object({
	text: z.string().min(1).max(300),
	detail: z.string().max(2_000).nullish(),
	timeframe: z.string().max(40).nullish(),
	source: z.string().max(20).optional(),
	sortIndex: z.number().int().optional(),
});
