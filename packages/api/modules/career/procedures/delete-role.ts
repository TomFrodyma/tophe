import { ORPCError } from "@orpc/server";
import { deleteCareerRoleForUser } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const deleteRole = protectedProcedure
	.route({
		method: "DELETE",
		path: "/career/roles/{id}",
		tags: ["Career"],
		summary: "Delete a career role",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input, context: { user } }) => {
		const count = await deleteCareerRoleForUser(input.id, user.id);
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const };
	});
