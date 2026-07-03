import { toggleMilestoneDone } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const toggleMilestone = protectedProcedure
	.route({
		method: "PUT",
		path: "/goals/milestones/{id}",
		tags: ["Goals"],
		summary: "Toggle a goal milestone done/undone",
	})
	.input(
		z.object({
			id: z.string().min(1),
			done: z.boolean(),
		}),
	)
	.handler(async ({ input: { id, done }, context: { user } }) => {
		const goalId = await toggleMilestoneDone({
			milestoneId: id,
			userId: user.id,
			done,
		});
		if (!goalId) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const, goalId };
	});
