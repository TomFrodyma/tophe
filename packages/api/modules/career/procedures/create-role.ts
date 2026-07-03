import { createCareerRole } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { serializeRole } from "../serialize";
import { roleInputSchema } from "../types";

export const createRole = protectedProcedure
	.route({
		method: "POST",
		path: "/career/roles",
		tags: ["Career"],
		summary: "Create a career role",
	})
	.input(roleInputSchema)
	.handler(async ({ input, context: { user } }) => {
		const role = await createCareerRole(user.id, input);
		return serializeRole(role);
	});
