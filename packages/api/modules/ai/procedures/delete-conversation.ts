import { ORPCError } from "@orpc/server";
import { deleteAgentConversation } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const deleteConversation = protectedProcedure
	.route({
		method: "DELETE",
		path: "/ai/conversations/{id}",
		tags: ["AI"],
		summary: "Delete a saved conversation",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input: { id }, context: { user } }) => {
		const count = await deleteAgentConversation(id, user.id);
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const };
	});
