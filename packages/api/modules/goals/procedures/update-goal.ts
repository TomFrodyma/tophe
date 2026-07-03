import { replaceGoalMilestones, updateGoal } from "@repo/database";
import { ORPCError } from "@orpc/server";

import { protectedProcedure } from "../../../orpc/procedures";
import { goalUpdateSchema } from "../types";

export const updateGoalProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/goals/{id}",
		tags: ["Goals"],
		summary: "Update a goal",
	})
	.input(goalUpdateSchema)
	.handler(async ({ input, context: { user } }) => {
		const count = await updateGoal({
			id: input.id,
			userId: user.id,
			title: input.title,
			description: input.description,
			targetValue: input.targetValue,
			unit: input.unit,
			startDate: input.startDate,
			dueDate: input.dueDate,
			color: input.color,
			icon: input.icon,
			cadence: input.cadence,
			horizon: input.horizon,
			status: input.status,
		});
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		if (input.milestones) {
			await replaceGoalMilestones({
				goalId: input.id,
				userId: user.id,
				milestones: input.milestones.map((m, idx) => ({
					id: m.id,
					title: m.title,
					order: m.order ?? idx,
					done: m.done ?? false,
				})),
			});
		}
		return { ok: true as const };
	});
