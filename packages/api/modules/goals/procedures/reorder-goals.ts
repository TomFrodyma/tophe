import { reorderGoals } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const reorderGoalsProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/goals/reorder",
		tags: ["Goals"],
		summary: "Set the manual order of goals",
	})
	.input(
		z.object({
			ids: z.array(z.string()).min(1).max(500),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		await reorderGoals(user.id, input.ids);
		return { ok: true as const };
	});
