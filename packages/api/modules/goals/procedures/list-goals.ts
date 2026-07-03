import { listGoalsForUser } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { goalHorizonSchema, goalStatusSchema } from "../types";

export const listGoals = protectedProcedure
	.route({
		method: "GET",
		path: "/goals",
		tags: ["Goals"],
		summary: "List goals",
	})
	.input(
		z.object({
			status: goalStatusSchema.nullish(),
			horizon: goalHorizonSchema.nullish(),
			search: z.string().max(200).optional(),
			take: z.number().int().min(1).max(200).optional(),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const goals = await listGoalsForUser(user.id, input.take ?? 200, {
			status: input.status ?? undefined,
			horizon: input.horizon ?? undefined,
			search: input.search,
		});
		return goals.map((goal) => ({
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
			checkInCount: goal._count.checkIns,
			milestones: goal.milestones.map((m) => ({
				id: m.id,
				title: m.title,
				order: m.order,
				done: m.done,
				doneAt: m.doneAt,
			})),
		}));
	});
