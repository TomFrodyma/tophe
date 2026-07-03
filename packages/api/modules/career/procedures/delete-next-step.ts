import { ORPCError } from "@orpc/server";
import { deleteCareerNextStepForUser } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const deleteNextStep = protectedProcedure
	.route({
		method: "DELETE",
		path: "/career/next-steps/{id}",
		tags: ["Career"],
		summary: "Delete a career next step",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input, context: { user } }) => {
		const count = await deleteCareerNextStepForUser(input.id, user.id);
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const };
	});
