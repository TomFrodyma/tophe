import { getGoalForUser } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const getGoal = protectedProcedure
	.route({
		method: "GET",
		path: "/goals/{id}",
		tags: ["Goals"],
		summary: "Get a goal",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input: { id }, context: { user } }) => {
		const goal = await getGoalForUser(id, user.id);
		if (!goal) {
			throw new ORPCError("NOT_FOUND");
		}
		return {
			id: goal.id,
			title: goal.title,
			description: goal.description,
			type: goal.type as string,
			status: goal.status as string,
			horizon: goal.horizon as string,
			targetValue: goal.targetValue,
			currentValue: goal.currentValue,
			unit: goal.unit,
			startDate: goal.startDate,
			dueDate: goal.dueDate,
			color: goal.color,
			icon: goal.icon,
			cadence: goal.cadence as string,
			lastCheckInAt: goal.lastCheckInAt,
			completedAt: goal.completedAt,
			createdAt: goal.createdAt,
			updatedAt: goal.updatedAt,
			milestones: goal.milestones.map((m) => ({
				id: m.id,
				title: m.title,
				order: m.order,
				done: m.done,
				doneAt: m.doneAt,
			})),
			checkIns: goal.checkIns.map((c) => ({
				id: c.id,
				value: c.value,
				note: c.note,
				createdAt: c.createdAt,
			})),
		};
	});
