import { ORPCError } from "@orpc/server";
import { updateCareerRole } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { serializeRole } from "../serialize";
import { roleInputSchema } from "../types";

export const updateRole = protectedProcedure
	.route({
		method: "PUT",
		path: "/career/roles/{id}",
		tags: ["Career"],
		summary: "Update a career role (replaces highlights and salaries)",
	})
	.input(roleInputSchema.extend({ id: z.string().min(1) }))
	.handler(async ({ input, context: { user } }) => {
		const { id, ...data } = input;
		const role = await updateCareerRole(id, user.id, data);
		if (!role) {
			throw new ORPCError("NOT_FOUND");
		}
		return serializeRole(role);
	});
