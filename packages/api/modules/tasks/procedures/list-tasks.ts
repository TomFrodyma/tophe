import { listTasksForUser } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { taskStatusSchema } from "../types";

export const listTasks = protectedProcedure
	.route({
		method: "GET",
		path: "/tasks",
		tags: ["Tasks"],
		summary: "List tasks",
	})
	.input(
		z.object({
			status: taskStatusSchema.nullish(),
			search: z.string().max(200).optional(),
			take: z.number().int().min(1).max(1000).optional(),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const tasks = await listTasksForUser(user.id, input.take ?? 500, {
			status: input.status ?? undefined,
			search: input.search,
		});
		return tasks.map((task) => ({
			id: task.id,
			title: task.title,
			notes: task.notes,
			status: task.status as string,
			dueDate: task.dueDate,
			completedAt: task.completedAt,
			createdAt: task.createdAt,
			updatedAt: task.updatedAt,
		}));
	});
