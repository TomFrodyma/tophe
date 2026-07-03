import { db } from "../client";
import type { TaskStatus } from "../generated/client";

export interface TaskFilters {
	status?: TaskStatus | null;
	search?: string;
}

export async function listTasksForUser(
	userId: string,
	limit = 500,
	filters: TaskFilters = {},
) {
	return await db.task.findMany({
		where: {
			userId,
			...(filters.status ? { status: filters.status } : {}),
			...(filters.search
				? {
						OR: [
							{ title: { contains: filters.search, mode: "insensitive" as const } },
							{ notes: { contains: filters.search, mode: "insensitive" as const } },
						],
					}
				: {}),
		},
		orderBy: [
			{ status: "asc" },
			{ dueDate: { sort: "asc", nulls: "last" } },
			{ createdAt: "desc" },
		],
		take: limit,
	});
}

export async function getTaskForUser(id: string, userId: string) {
	return await db.task.findFirst({
		where: { id, userId },
	});
}

export async function createTask({
	userId,
	title,
	notes,
	dueDate,
}: {
	userId: string;
	title: string;
	notes?: string | null;
	dueDate?: Date | null;
}) {
	return await db.task.create({
		data: {
			userId,
			title,
			notes: notes ?? null,
			dueDate: dueDate ?? null,
		},
	});
}

export async function updateTask({
	id,
	userId,
	title,
	notes,
	dueDate,
	status,
}: {
	id: string;
	userId: string;
	title?: string;
	notes?: string | null;
	dueDate?: Date | null;
	status?: TaskStatus;
}) {
	const data: Record<string, unknown> = {
		...(title !== undefined ? { title } : {}),
		...(notes !== undefined ? { notes } : {}),
		...(dueDate !== undefined ? { dueDate } : {}),
		...(status !== undefined ? { status } : {}),
	};
	if (status === "DONE") {
		data.completedAt = new Date();
	} else if (status === "OPEN") {
		data.completedAt = null;
	}
	const result = await db.task.updateMany({
		where: { id, userId },
		data,
	});
	return result.count;
}

export async function deleteTask(id: string, userId: string) {
	const result = await db.task.deleteMany({
		where: { id, userId },
	});
	return result.count;
}
