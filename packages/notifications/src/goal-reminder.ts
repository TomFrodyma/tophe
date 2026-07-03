import { db } from "@repo/database";

import { createNotification } from "./create-notification";
import { DEFAULT_TIMEZONE, getUserLocalInfo } from "./tz";

const CHECKIN_HOUR = 9;
const DEADLINE_WINDOW_DAYS = 7;

interface EnsureGoalRemindersOptions {
	userId: string;
	now?: Date;
	afterHour?: number;
}

function isDueForCadence(
	cadence: string,
	lastCheckInAt: Date | null,
	lastReminderAt: Date | null,
	localStartOfDay: Date,
	dayOfWeek: number,
	dayOfMonth: number,
): boolean {
	const todayFloorMs = localStartOfDay.getTime();

	if (lastReminderAt && lastReminderAt.getTime() >= todayFloorMs) {
		return false;
	}

	if (cadence === "DAILY") {
		if (!lastCheckInAt) return true;
		return lastCheckInAt.getTime() < todayFloorMs;
	}

	if (cadence === "WEEKLY") {
		if (dayOfWeek !== 1) return false;
		if (!lastCheckInAt) return true;
		const weekAgo = todayFloorMs - 7 * 24 * 60 * 60 * 1000;
		return lastCheckInAt.getTime() < weekAgo;
	}

	if (cadence === "MONTHLY") {
		if (dayOfMonth !== 1) return false;
		if (!lastCheckInAt) return true;
		const monthAgo = new Date(localStartOfDay);
		monthAgo.setMonth(monthAgo.getMonth() - 1);
		return lastCheckInAt.getTime() < monthAgo.getTime();
	}

	return false;
}

/**
 * Creates check-in and deadline-approaching reminders for a user's active goals.
 * Idempotent per local day (lastReminderAt) and per goal (deadlineNotifiedAt).
 */
export async function ensureGoalReminders({
	userId,
	now = new Date(),
	afterHour = CHECKIN_HOUR,
}: EnsureGoalRemindersOptions) {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { timezone: true },
	});
	const timezone = user?.timezone || DEFAULT_TIMEZONE;
	const local = getUserLocalInfo(now, timezone);
	if (local.hour < afterHour) return { checkIns: 0, deadlines: 0 };

	const dayOfWeek = new Date(local.startOfDay).getUTCDay();
	const dayOfMonth = local.day;

	const goals = await db.goal.findMany({
		where: { userId, status: "ACTIVE" },
		select: {
			id: true,
			title: true,
			cadence: true,
			lastCheckInAt: true,
			lastReminderAt: true,
			dueDate: true,
			deadlineNotifiedAt: true,
			targetValue: true,
			currentValue: true,
			unit: true,
			type: true,
		},
	});

	let checkIns = 0;
	let deadlines = 0;
	const deadlineWindowMs = DEADLINE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
	const nowMs = now.getTime();

	for (const goal of goals) {
		if (
			goal.cadence !== "NONE" &&
			isDueForCadence(
				goal.cadence,
				goal.lastCheckInAt,
				goal.lastReminderAt,
				local.startOfDay,
				dayOfWeek,
				dayOfMonth,
			)
		) {
			await createNotification({
				userId,
				type: "GOAL_CHECKIN_REMINDER",
				link: `/goals/${goal.id}`,
				data: {
					goalId: goal.id,
					title: goal.title,
					headline: `Check in on ${goal.title}`,
					message: buildCheckInMessage(goal),
				},
			});
			await db.goal.update({
				where: { id: goal.id },
				data: { lastReminderAt: now },
			});
			checkIns++;
		}

		if (
			goal.dueDate &&
			!goal.deadlineNotifiedAt &&
			goal.dueDate.getTime() >= nowMs &&
			goal.dueDate.getTime() - nowMs <= deadlineWindowMs
		) {
			const daysLeft = Math.max(
				1,
				Math.ceil((goal.dueDate.getTime() - nowMs) / (24 * 60 * 60 * 1000)),
			);
			await createNotification({
				userId,
				type: "GOAL_DEADLINE_APPROACHING",
				link: `/goals/${goal.id}`,
				data: {
					goalId: goal.id,
					title: goal.title,
					headline: `${goal.title} is due soon`,
					message: `Due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
					daysLeft,
				},
			});
			await db.goal.update({
				where: { id: goal.id },
				data: { deadlineNotifiedAt: now },
			});
			deadlines++;
		}
	}

	return { checkIns, deadlines };
}

function buildCheckInMessage(goal: {
	type: string;
	targetValue: number | null;
	currentValue: number;
	unit: string | null;
}): string {
	if (goal.type === "NUMERIC" && goal.targetValue != null) {
		const unit = goal.unit ? ` ${goal.unit}` : "";
		return `Progress: ${formatValue(goal.currentValue)} / ${formatValue(goal.targetValue)}${unit}.`;
	}
	return "Log a quick update on your progress.";
}

function formatValue(n: number): string {
	return Number.isInteger(n) ? n.toString() : n.toFixed(1);
}
