export interface TaskLite {
	id: string;
	title: string;
	notes: string | null;
	status: string;
	dueDate: Date | string | null;
	completedAt: Date | string | null;
	createdAt: Date | string;
	updatedAt: Date | string;
}

function startOfLocalDay(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isToday(value: Date | string | null, now = new Date()): boolean {
	if (!value) return false;
	const d = typeof value === "string" ? new Date(value) : value;
	const startToday = startOfLocalDay(now);
	const startTomorrow = new Date(startToday);
	startTomorrow.setDate(startTomorrow.getDate() + 1);
	return d.getTime() >= startToday.getTime() && d.getTime() < startTomorrow.getTime();
}

export function isOverdue(value: Date | string | null, now = new Date()): boolean {
	if (!value) return false;
	const d = typeof value === "string" ? new Date(value) : value;
	return d.getTime() < startOfLocalDay(now).getTime();
}

export function isWithinNextDays(
	value: Date | string | null,
	days: number,
	now = new Date(),
): boolean {
	if (!value) return false;
	const d = typeof value === "string" ? new Date(value) : value;
	const cutoff = new Date(startOfLocalDay(now));
	cutoff.setDate(cutoff.getDate() + days + 1);
	return d.getTime() >= startOfLocalDay(now).getTime() && d.getTime() < cutoff.getTime();
}

export function filterForTodayTab(tasks: TaskLite[], now = new Date()): TaskLite[] {
	return tasks.filter(
		(t) =>
			t.status === "OPEN" &&
			(t.dueDate === null || isOverdue(t.dueDate, now) || isToday(t.dueDate, now)),
	);
}

export function filterForUpcomingTab(tasks: TaskLite[], now = new Date()): TaskLite[] {
	return tasks.filter((t) => {
		if (t.status !== "OPEN") return false;
		if (!t.dueDate) return false;
		if (isOverdue(t.dueDate, now) || isToday(t.dueDate, now)) return false;
		return isWithinNextDays(t.dueDate, 7, now);
	});
}
