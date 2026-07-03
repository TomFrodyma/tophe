import { getCareerProfileForUser } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { parseInsights } from "../insights";

export const getProfile = protectedProcedure
	.route({
		method: "GET",
		path: "/career/profile",
		tags: ["Career"],
		summary: "Get career reflections and the last generated AI insights",
	})
	.handler(async ({ context: { user } }) => {
		const profile = await getCareerProfileForUser(user.id);
		return {
			reflections: profile?.reflections ?? "",
			insights: parseInsights(profile?.insightsJson ?? null),
			insightsGeneratedAt: profile?.insightsGeneratedAt
				? profile.insightsGeneratedAt.toISOString()
				: null,
		};
	});
