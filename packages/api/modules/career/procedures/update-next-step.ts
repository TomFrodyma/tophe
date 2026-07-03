import { ORPCError } from "@orpc/server";
import { updateCareerNextStep } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const updateNextStep = protectedProcedure
	.route({
		method: "PUT",
		path: "/career/next-steps/{id}",
		tags: ["Career"],
		summary: "Update a career next step",
	})
	.input(
		z.object({
			id: z.string().min(1),
			text: z.string().min(1).max(300).optional(),
			detail: z.string().max(2_000).nullish(),
			timeframe: z.string().max(40).nullish(),
			done: z.boolean().optional(),
			sortIndex: z.number().int().optional(),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const { id, ...data } = input;
		const count = await updateCareerNextStep(id, user.id, data);
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const };
	});
