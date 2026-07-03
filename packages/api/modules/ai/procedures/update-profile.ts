import { upsertAgentProfile } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const updateProfile = protectedProcedure
	.route({
		method: "PUT",
		path: "/ai/profile",
		tags: ["AI"],
		summary: "Update the agent's persona and core profile",
	})
	.input(
		z.object({
			name: z.string().trim().min(1).max(50),
			personaPrompt: z.string().min(1).max(8000),
			coreProfile: z.string().min(1).max(8000),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		await upsertAgentProfile(
			user.id,
			input.personaPrompt.trim(),
			input.coreProfile.trim(),
			input.name,
		);
		return { ok: true as const };
	});
