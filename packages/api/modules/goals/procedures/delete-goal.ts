import { deleteGoal } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const deleteGoalProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/goals/{id}",
		tags: ["Goals"],
		summary: "Delete a goal",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input: { id }, context: { user } }) => {
		const count = await deleteGoal(id, user.id);
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const };
	});
