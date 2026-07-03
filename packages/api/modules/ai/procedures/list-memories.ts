import { listAgentMemoriesForUser } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";

export const listMemories = protectedProcedure
	.route({
		method: "GET",
		path: "/ai/memories",
		tags: ["AI"],
		summary: "List what the agent has remembered",
	})
	.handler(async ({ context: { user } }) => {
		const memories = await listAgentMemoriesForUser(user.id);
		return memories.map((m) => ({
			id: m.id,
			content: m.content,
			source: m.source,
			createdAt: m.createdAt,
		}));
	});
