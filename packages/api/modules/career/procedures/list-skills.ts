import { listCareerSkillsForUser } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { serializeSkill } from "../serialize";

export const listSkills = protectedProcedure
	.route({
		method: "GET",
		path: "/career/skills",
		tags: ["Career"],
		summary: "List career skills",
	})
	.handler(async ({ context: { user } }) => {
		const skills = await listCareerSkillsForUser(user.id);
		return skills.map(serializeSkill);
	});
