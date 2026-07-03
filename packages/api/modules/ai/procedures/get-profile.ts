import { getAgentProfileForUser } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { agentProfileResponse } from "../lib/profile-response";

export const getProfile = protectedProcedure
	.route({
		method: "GET",
		path: "/ai/profile",
		tags: ["AI"],
		summary: "Get the agent's persona and core profile",
	})
	.handler(async ({ context: { user } }) => {
		const profile = await getAgentProfileForUser(user.id);
		return agentProfileResponse(profile);
	});
