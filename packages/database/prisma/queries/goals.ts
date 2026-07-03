import { db } from "../client";
import type {
	GoalCadence,
	GoalHorizon,
	GoalStatus,
	GoalType,
} from "../generated/client";

export interface GoalFilters {
	status?: GoalStatus | null;
	horizon?: GoalHorizon | null;
	search?: string;
}

export interface GoalInput {
	title: string;
	description?: string | null;
	type: GoalType;
	horizon?: GoalHorizon;
	targetValue?: number | null;
	currentValue?: number;
	unit?: string | null;
	startDate?: Date | null;
	dueDate?: Date | null;
	color?: string;
	icon?: string | null;
	cadence?: GoalCadence;
	milestones?: { title: string; order: number }[];
}

function buildGoalWhere(userId: string, filters: GoalFilters = {}) {
	return {
		userId,
		...(filters.status ? { status: filters.status } : {}),
		...(filters.horizon ? { horizon: filters.horizon } : {}),
		...(filters.search
			? {
					OR: [
						{ title: { contains: filters.search, mode: "insensitive" as const } },
						{
							description: {
								contains: filters.search,
								mode: "insensitive" as const,
							},
						},
					],
				}
			: {}),
	};
}

export async function listGoalsForUser(
	userId: string,
	limit = 200,
	filters: GoalFilters = {},
) {
	return await db.goal.findMany({
		where: buildGoalWhere(userId, filters),
		// Manual order beats status, so a dragged goal stays where it was put even
		// after completion. Never-dragged goals (all 0) keep the old status sort.
		orderBy: [
			{ horizon: "asc" },
			{ sortOrder: "asc" },
			{ status: "asc" },
			{ createdAt: "desc" },
		],
		take: limit,
		include: {
			milestones: { orderBy: { order: "asc" } },
			_count: { select: { checkIns: true } },
		},
	});
}

export async function getGoalForUser(id: string, userId: string) {
	return await db.goal.findFirst({
		where: { id, userId },
		include: {
			milestones: { orderBy: { order: "asc" } },
			checkIns: { orderBy: { createdAt: "desc" }, take: 50 },
		},
	});
}

export async function createGoal({
	userId,
	title,
	description,
	type,
	horizon,
	targetValue,
	currentValue,
	unit,
	startDate,
	dueDate,
	color,
	icon,
	cadence,
	milestones,
}: GoalInput & { userId: string }) {
	return await db.goal.create({
		data: {
			userId,
			title,
			description: description ?? null,
			type,
			horizon: horizon ?? "LONG_TERM",
			targetValue: targetValue ?? null,
			currentValue: currentValue ?? 0,
			unit: unit ?? null,
			startDate: startDate ?? null,
			dueDate: dueDate ?? null,
			color: color ?? "sky",
			icon: icon ?? null,
			cadence: cadence ?? "NONE",
			...(milestones && milestones.length > 0
				? {
						milestones: {
							create: milestones.map((m) => ({
								title: m.title,
								order: m.order,
							})),
						},
					}
				: {}),
		},
		include: { milestones: { orderBy: { order: "asc" } } },
	});
}

export async function updateGoal({
	id,
	userId,
	title,
	description,
	targetValue,
	unit,
	startDate,
	dueDate,
	color,
	icon,
	cadence,
	horizon,
	status,
}: {
	id: string;
	userId: string;
	title?: string;
	description?: string | null;
	targetValue?: number | null;
	unit?: string | null;
	startDate?: Date | null;
	dueDate?: Date | null;
	color?: string;
	icon?: string | null;
	cadence?: GoalCadence;
	horizon?: GoalHorizon;
	status?: GoalStatus;
}) {
	const data: Record<string, unknown> = {
		...(title !== undefined ? { title } : {}),
		...(description !== undefined ? { description } : {}),
		...(targetValue !== undefined ? { targetValue } : {}),
		...(unit !== undefined ? { unit } : {}),
		...(startDate !== undefined ? { startDate } : {}),
		...(dueDate !== undefined ? { dueDate } : {}),
		...(color !== undefined ? { color } : {}),
		...(icon !== undefined ? { icon } : {}),
		...(cadence !== undefined ? { cadence } : {}),
		...(horizon !== undefined ? { horizon } : {}),
		...(status !== undefined ? { status } : {}),
	};
	if (status === "COMPLETED") {
		data.completedAt = new Date();
	} else if (status !== undefined) {
		data.completedAt = null;
	}
	const result = await db.goal.updateMany({
		where: { id, userId },
		data,
	});
	return result.count;
}

export async function deleteGoal(id: string, userId: string) {
	const result = await db.goal.deleteMany({
		where: { id, userId },
	});
	return result.count;
}

/** Persist a drag order: sortOrder 1..n in the given sequence. Scoped to the
 *  caller, so foreign ids are silently skipped. */
export async function reorderGoals(userId: string, ids: string[]) {
	await db.$transaction(
		ids.map((id, index) =>
			db.goal.updateMany({
				where: { id, userId },
				data: { sortOrder: index + 1 },
			}),
		),
	);
}

export async function replaceGoalMilestones({
	goalId,
	userId,
	milestones,
}: {
	goalId: string;
	userId: string;
	milestones: { id?: string; title: string; order: number; done: boolean }[];
}) {
	const owned = await db.goal.findFirst({
		where: { id: goalId, userId },
		select: { id: true },
	});
	if (!owned) return 0;

	const keepIds = milestones.filter((m) => m.id).map((m) => m.id!) as string[];
	return await db.$transaction(async (tx) => {
		await tx.goalMilestone.deleteMany({
			where: {
				goalId,
				...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
			},
		});
		for (const m of milestones) {
			if (m.id) {
				await tx.goalMilestone.update({
					where: { id: m.id },
					data: {
						title: m.title,
						order: m.order,
						done: m.done,
						doneAt: m.done ? new Date() : null,
					},
				});
			} else {
				await tx.goalMilestone.create({
					data: {
						goalId,
						title: m.title,
						order: m.order,
						done: m.done,
						doneAt: m.done ? new Date() : null,
					},
				});
			}
		}
		return 1;
	});
}

export async function toggleMilestoneDone({
	milestoneId,
	userId,
	done,
}: {
	milestoneId: string;
	userId: string;
	done: boolean;
}) {
	const milestone = await db.goalMilestone.findFirst({
		where: { id: milestoneId, goal: { userId } },
		select: { id: true, goalId: true },
	});
	if (!milestone) return null;
	await db.goalMilestone.update({
		where: { id: milestoneId },
		data: {
			done,
			doneAt: done ? new Date() : null,
		},
	});
	return milestone.goalId;
}

export async function createGoalCheckIn({
	goalId,
	userId,
	value,
	note,
}: {
	goalId: string;
	userId: string;
	value: number;
	note?: string | null;
}) {
	const goal = await db.goal.findFirst({
		where: { id: goalId, userId },
		select: {
			id: true,
			type: true,
			currentValue: true,
			targetValue: true,
			status: true,
		},
	});
	if (!goal) return null;

	const checkIn = await db.goalCheckIn.create({
		data: {
			goalId,
			userId,
			value,
			note: note ?? null,
		},
	});

	let nextValue = goal.currentValue;
	if (goal.type === "NUMERIC") {
		nextValue = goal.currentValue + value;
	} else if (goal.type === "BOOLEAN") {
		nextValue = value > 0 ? 1 : 0;
	}

	const reachedTarget =
		goal.type === "NUMERIC" && goal.targetValue != null && nextValue >= goal.targetValue;
	const completedBoolean = goal.type === "BOOLEAN" && nextValue >= 1;
	const shouldComplete = goal.status === "ACTIVE" && (reachedTarget || completedBoolean);

	await db.goal.update({
		where: { id: goalId },
		data: {
			currentValue: nextValue,
			lastCheckInAt: new Date(),
			...(shouldComplete
				? { status: "COMPLETED", completedAt: new Date() }
				: {}),
		},
	});

	return { checkIn, completed: shouldComplete };
}

export async function deleteGoalCheckIn({
	id,
	userId,
}: {
	id: string;
	userId: string;
}) {
	const checkIn = await db.goalCheckIn.findFirst({
		where: { id, userId },
		include: { goal: { select: { id: true, type: true, currentValue: true } } },
	});
	if (!checkIn) return 0;

	await db.$transaction(async (tx) => {
		await tx.goalCheckIn.delete({ where: { id } });
		if (checkIn.goal.type === "NUMERIC") {
			await tx.goal.update({
				where: { id: checkIn.goal.id },
				data: {
					currentValue: Math.max(0, checkIn.goal.currentValue - checkIn.value),
				},
			});
		}
	});
	return 1;
}

export async function listGoalsNeedingReminder(now: Date) {
	return await db.goal.findMany({
		where: {
			status: "ACTIVE",
			cadence: { not: "NONE" },
		},
		include: {
			user: { select: { id: true, timezone: true, locale: true } },
		},
	});
}

export async function listGoalsWithApproachingDeadline(now: Date) {
	const cutoff = new Date(now);
	cutoff.setDate(cutoff.getDate() + 7);
	return await db.goal.findMany({
		where: {
			status: "ACTIVE",
			dueDate: { gte: now, lte: cutoff },
			deadlineNotifiedAt: null,
		},
		include: {
			user: { select: { id: true, timezone: true, locale: true } },
		},
	});
}

export async function markGoalReminderSent(id: string, at: Date) {
	await db.goal.update({
		where: { id },
		data: { lastReminderAt: at },
	});
}

export async function markGoalDeadlineNotified(id: string, at: Date) {
	await db.goal.update({
		where: { id },
		data: { deadlineNotifiedAt: at },
	});
}
