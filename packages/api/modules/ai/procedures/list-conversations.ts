import { listAgentConversationsForUser } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";

export const listConversations = protectedProcedure
	.route({
		method: "GET",
		path: "/ai/conversations",
		tags: ["AI"],
		summary: "List the agent's saved conversations",
	})
	.handler(async ({ context: { user } }) => {
		const conversations = await listAgentConversationsForUser(user.id);
		return conversations.map((c) => ({
			id: c.id,
			title: c.title,
			createdAt: c.createdAt,
			updatedAt: c.updatedAt,
		}));
	});
