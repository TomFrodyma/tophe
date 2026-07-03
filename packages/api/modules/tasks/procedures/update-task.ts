import { type TaskStatus, updateTask } from "@repo/database";
import { ORPCError } from "@orpc/server";

import { protectedProcedure } from "../../../orpc/procedures";
import { taskUpdateSchema } from "../types";

export const updateTaskProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/tasks/{id}",
		tags: ["Tasks"],
		summary: "Update a task",
	})
	.input(taskUpdateSchema)
	.handler(async ({ input, context: { user } }) => {
		const count = await updateTask({
			id: input.id,
			userId: user.id,
			title: input.title,
			notes: input.notes,
			dueDate: input.dueDate,
			status: input.status as TaskStatus | undefined,
		});
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const };
	});
