import { getAgentProfileForUser, getUserById } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { generateStartGreeting } from "../lib/greeting";

export const getStartGreeting = protectedProcedure
	.route({
		method: "GET",
		path: "/ai/start-greeting",
		tags: ["AI"],
		summary: "Personal, time/weather/date-aware start-page greeting from the agent",
	})
	.handler(async ({ context: { user } }) => {
		const [profile, dbUser] = await Promise.all([
			getAgentProfileForUser(user.id),
			getUserById(user.id),
		]);

		const firstName = user.name?.split(" ")[0] || user.name || "";

		return generateStartGreeting({
			userId: user.id,
			firstName,
			persona: profile?.personaPrompt,
			agentName: profile?.name,
			timezone: dbUser?.timezone ?? "UTC",
			now: new Date(),
		});
	});
