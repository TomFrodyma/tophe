import { setUserPinnedModules } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

const moduleIdSchema = z.enum([
	"chatbot",
	"journal",
	"goals",
	"tasks",
	"notes",
	"career",
	"wishlist",
]);

export const setPinnedModules = protectedProcedure
	.route({
		method: "PUT",
		path: "/users/pinned-modules",
		tags: ["Users"],
		summary: "Set pinned modules",
	})
	.input(
		z.object({
			pinnedModules: z.array(moduleIdSchema).max(10),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const unique = Array.from(new Set(input.pinnedModules));
		const modules = await setUserPinnedModules(user.id, unique);
		return { pinnedModules: modules };
	});
