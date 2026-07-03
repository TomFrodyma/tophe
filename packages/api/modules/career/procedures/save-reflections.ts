import { saveCareerReflections } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const saveReflections = protectedProcedure
	.route({
		method: "PUT",
		path: "/career/profile/reflections",
		tags: ["Career"],
		summary: "Save career reflections",
	})
	.input(z.object({ reflections: z.string().max(10_000) }))
	.handler(async ({ input, context: { user } }) => {
		await saveCareerReflections(user.id, input.reflections);
		return { ok: true as const };
	});
