import { requireCronAuth } from "../cron-auth";
import { db } from "@repo/database";
import { ensureGoalReminders, ensureJournalDailyReminder } from "@repo/notifications";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handle(request: Request) {
	const authError = requireCronAuth(request);
	if (authError) {
		return authError;
	}

	const users = await db.user.findMany({ select: { id: true } });
	const now = new Date();

	const journalResults = await Promise.allSettled(
		users.map((u) =>
			ensureJournalDailyReminder({
				userId: u.id,
				now,
			}),
		),
	);

	const goalResults = await Promise.allSettled(
		users.map((u) =>
			ensureGoalReminders({
				userId: u.id,
				now,
			}),
		),
	);

	const journalCreated = journalResults.filter(
		(r) => r.status === "fulfilled" && r.value !== null,
	).length;
	const journalFailed = journalResults.filter((r) => r.status === "rejected").length;

	const goalCheckIns = goalResults.reduce(
		(acc, r) => acc + (r.status === "fulfilled" ? r.value.checkIns : 0),
		0,
	);
	const goalDeadlines = goalResults.reduce(
		(acc, r) => acc + (r.status === "fulfilled" ? r.value.deadlines : 0),
		0,
	);
	const goalFailed = goalResults.filter((r) => r.status === "rejected").length;

	return NextResponse.json({
		ok: true,
		users: users.length,
		journal: { created: journalCreated, failed: journalFailed },
		goals: { checkIns: goalCheckIns, deadlines: goalDeadlines, failed: goalFailed },
		at: now.toISOString(),
	});
}

export const GET = handle;
export const POST = handle;
