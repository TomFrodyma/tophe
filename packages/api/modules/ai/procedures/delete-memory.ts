import { ORPCError } from "@orpc/server";
import { deleteAgentMemory } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const deleteMemory = protectedProcedure
	.route({
		method: "DELETE",
		path: "/ai/memories/{id}",
		tags: ["AI"],
		summary: "Forget a single memory",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input: { id }, context: { user } }) => {
		const count = await deleteAgentMemory(id, user.id);
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const };
	});
