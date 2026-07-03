import { ORPCError } from "@orpc/server";
import { updateCareerSkill } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { skillInputSchema } from "../types";

export const updateSkill = protectedProcedure
	.route({
		method: "PUT",
		path: "/career/skills/{id}",
		tags: ["Career"],
		summary: "Update a career skill",
	})
	.input(skillInputSchema.partial().extend({ id: z.string().min(1) }))
	.handler(async ({ input, context: { user } }) => {
		const { id, ...data } = input;
		const count = await updateCareerSkill(id, user.id, data);
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const };
	});
