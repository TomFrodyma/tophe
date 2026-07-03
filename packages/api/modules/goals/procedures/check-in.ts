import { createGoalCheckIn } from "@repo/database";
import { ORPCError } from "@orpc/server";

import { protectedProcedure } from "../../../orpc/procedures";
import { goalCheckInInputSchema } from "../types";

export const checkInGoal = protectedProcedure
	.route({
		method: "POST",
		path: "/goals/{goalId}/check-ins",
		tags: ["Goals"],
		summary: "Log a check-in on a goal",
	})
	.input(goalCheckInInputSchema)
	.handler(async ({ input, context: { user } }) => {
		const result = await createGoalCheckIn({
			goalId: input.goalId,
			userId: user.id,
			value: input.value,
			note: input.note ?? null,
		});
		if (!result) {
			throw new ORPCError("NOT_FOUND");
		}
		return {
			id: result.checkIn.id,
			value: result.checkIn.value,
			note: result.checkIn.note,
			createdAt: result.checkIn.createdAt,
			completed: result.completed,
		};
	});
