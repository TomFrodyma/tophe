import { ORPCError } from "@orpc/server";
import { getAgentConversationForUser } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const getConversation = protectedProcedure
	.route({
		method: "GET",
		path: "/ai/conversations/{id}",
		tags: ["AI"],
		summary: "Get a saved conversation with its messages",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input: { id }, context: { user } }) => {
		const conversation = await getAgentConversationForUser(id, user.id);
		if (!conversation) {
			throw new ORPCError("NOT_FOUND");
		}
		return {
			id: conversation.id,
			title: conversation.title,
			// parts is stored as JSON; shape matches the AI SDK UIMessage on the client.
			messages: conversation.messages.map((m) => ({
				id: m.id,
				role: m.role,
				parts: m.parts,
			})),
		};
	});
