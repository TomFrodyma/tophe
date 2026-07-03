import { createGoal } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { goalInputSchema } from "../types";

export const createGoalProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/goals",
		tags: ["Goals"],
		summary: "Create a goal",
	})
	.input(goalInputSchema)
	.handler(async ({ input, context: { user } }) => {
		const goal = await createGoal({
			userId: user.id,
			title: input.title,
			description: input.description ?? null,
			type: input.type,
			horizon: input.horizon ?? "LONG_TERM",
			targetValue: input.targetValue ?? null,
			unit: input.unit ?? null,
			startDate: input.startDate ?? null,
			dueDate: input.dueDate ?? null,
			color: input.color ?? "sky",
			icon: input.icon ?? null,
			cadence: input.cadence ?? "NONE",
			milestones: input.milestones?.map((m, idx) => ({
				title: m.title,
				order: m.order ?? idx,
			})),
		});
		return { id: goal.id };
	});
