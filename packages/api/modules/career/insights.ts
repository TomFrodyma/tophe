import { z } from "zod";

import { NEXT_STEP_TIMEFRAMES } from "./types";

export const careerInsightsSchema = z.object({
	summary: z
		.string()
		.describe("A short, honest 2-3 sentence read on where this career stands now."),
	strengths: z
		.array(z.string())
		.describe("Concrete strengths evident from the history. 3-5 items."),
	watchOuts: z.array(z.string()).describe("Risks, gaps, or things to be mindful of. 2-4 items."),
	nextSteps: z
		.array(
			z.object({
				title: z.string().describe("Short, actionable next step."),
				rationale: z.string().describe("Why this step makes sense given the history."),
				timeframe: z.enum(NEXT_STEP_TIMEFRAMES),
				effort: z.enum(["LOW", "MEDIUM", "HIGH"]),
			}),
		)
		.describe("3-5 specific, logical next steps."),
});

export type CareerInsights = z.infer<typeof careerInsightsSchema>;

export function parseInsights(json: string | null): CareerInsights | null {
	if (!json) {
		return null;
	}
	try {
		const parsed = careerInsightsSchema.safeParse(JSON.parse(json));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}
