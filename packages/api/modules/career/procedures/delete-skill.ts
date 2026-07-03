import { ORPCError } from "@orpc/server";
import { deleteCareerSkillForUser } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const deleteSkill = protectedProcedure
	.route({
		method: "DELETE",
		path: "/career/skills/{id}",
		tags: ["Career"],
		summary: "Delete a career skill",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input, context: { user } }) => {
		const count = await deleteCareerSkillForUser(input.id, user.id);
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const };
	});
