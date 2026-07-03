import { deleteTask } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const deleteTaskProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/tasks/{id}",
		tags: ["Tasks"],
		summary: "Delete a task",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input: { id }, context: { user } }) => {
		const count = await deleteTask(id, user.id);
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const };
	});
