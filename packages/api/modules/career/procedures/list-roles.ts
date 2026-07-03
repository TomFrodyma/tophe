import { listCareerRolesForUser } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { serializeRole } from "../serialize";

export const listRoles = protectedProcedure
	.route({
		method: "GET",
		path: "/career/roles",
		tags: ["Career"],
		summary: "List career roles with highlights and salaries",
	})
	.handler(async ({ context: { user } }) => {
		const roles = await listCareerRolesForUser(user.id);
		return roles.map(serializeRole);
	});
