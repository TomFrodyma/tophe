import { ORPCError } from "@orpc/server";
import { getCareerRoleForUser } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { serializeRole } from "../serialize";

export const getRole = protectedProcedure
	.route({
		method: "GET",
		path: "/career/roles/{id}",
		tags: ["Career"],
		summary: "Get a single career role",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input, context: { user } }) => {
		const role = await getCareerRoleForUser(input.id, user.id);
		if (!role) {
			throw new ORPCError("NOT_FOUND");
		}
		return serializeRole(role);
	});
