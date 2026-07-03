import { deleteGoalCheckIn } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const deleteCheckIn = protectedProcedure
	.route({
		method: "DELETE",
		path: "/goals/check-ins/{id}",
		tags: ["Goals"],
		summary: "Delete a goal check-in",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input: { id }, context: { user } }) => {
		const count = await deleteGoalCheckIn({ id, userId: user.id });
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const };
	});
