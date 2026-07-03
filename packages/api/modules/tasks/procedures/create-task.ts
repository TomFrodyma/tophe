import { createTask } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { taskInputSchema } from "../types";

export const createTaskProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/tasks",
		tags: ["Tasks"],
		summary: "Create a task",
	})
	.input(taskInputSchema)
	.handler(async ({ input, context: { user } }) => {
		const task = await createTask({
			userId: user.id,
			title: input.title,
			notes: input.notes ?? null,
			dueDate: input.dueDate ?? null,
		});
		return {
			id: task.id,
			title: task.title,
			notes: task.notes,
			status: task.status as string,
			dueDate: task.dueDate,
			completedAt: task.completedAt,
			createdAt: task.createdAt,
			updatedAt: task.updatedAt,
		};
	});
