export const GOAL_TYPES = ["NUMERIC", "BOOLEAN", "MILESTONE"] as const;
export type GoalTypeValue = (typeof GOAL_TYPES)[number];

export const GOAL_STATUSES = [
	"ACTIVE",
	"COMPLETED",
	"PAUSED",
	"ARCHIVED",
] as const;
export type GoalStatusValue = (typeof GOAL_STATUSES)[number];

export const GOAL_CADENCES = ["NONE", "DAILY", "WEEKLY", "MONTHLY"] as const;
export type GoalCadenceValue = (typeof GOAL_CADENCES)[number];

export const GOAL_HORIZONS = ["LONG_TERM", "PROJECT", "HABIT"] as const;
export type GoalHorizonValue = (typeof GOAL_HORIZONS)[number];

export function isGoalHorizon(value: unknown): value is GoalHorizonValue {
	return (
		typeof value === "string" &&
		(GOAL_HORIZONS as readonly string[]).includes(value)
	);
}

export function isGoalType(value: unknown): value is GoalTypeValue {
	return typeof value === "string" && (GOAL_TYPES as readonly string[]).includes(value);
}

export function isGoalStatus(value: unknown): value is GoalStatusValue {
	return typeof value === "string" && (GOAL_STATUSES as readonly string[]).includes(value);
}

export function isGoalCadence(value: unknown): value is GoalCadenceValue {
	return typeof value === "string" && (GOAL_CADENCES as readonly string[]).includes(value);
}

export function computeProgress(goal: {
	type: string;
	currentValue: number;
	targetValue: number | null;
	milestones: { done: boolean }[];
}): { ratio: number; label: string } {
	if (goal.type === "NUMERIC" && goal.targetValue && goal.targetValue > 0) {
		const ratio = Math.min(1, Math.max(0, goal.currentValue / goal.targetValue));
		return {
			ratio,
			label: `${formatNumber(goal.currentValue)} / ${formatNumber(goal.targetValue)}`,
		};
	}
	if (goal.type === "MILESTONE") {
		const total = goal.milestones.length;
		if (total === 0) return { ratio: 0, label: "0 / 0" };
		const done = goal.milestones.filter((m) => m.done).length;
		return { ratio: done / total, label: `${done} / ${total}` };
	}
	if (goal.type === "BOOLEAN") {
		const done = goal.currentValue >= 1;
		return { ratio: done ? 1 : 0, label: done ? "Done" : "Not done" };
	}
	return { ratio: 0, label: "0" };
}

function formatNumber(n: number): string {
	if (Number.isInteger(n)) return n.toString();
	return n.toFixed(1);
}
