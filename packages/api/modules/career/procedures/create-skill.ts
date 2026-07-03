import { createCareerSkill } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { serializeSkill } from "../serialize";
import { skillInputSchema } from "../types";

export const createSkill = protectedProcedure
	.route({
		method: "POST",
		path: "/career/skills",
		tags: ["Career"],
		summary: "Create a career skill",
	})
	.input(skillInputSchema)
	.handler(async ({ input, context: { user } }) => {
		const skill = await createCareerSkill(user.id, input);
		return serializeSkill(skill);
	});
