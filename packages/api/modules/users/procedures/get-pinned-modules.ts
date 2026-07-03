import { getUserPinnedModules } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";

export const getPinnedModules = protectedProcedure
	.route({
		method: "GET",
		path: "/users/pinned-modules",
		tags: ["Users"],
		summary: "Get pinned modules",
	})
	.handler(async ({ context: { user } }) => {
		const modules = await getUserPinnedModules(user.id);
		return { pinnedModules: modules };
	});
