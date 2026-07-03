import { requireCronAuth } from "../cron-auth";
import {
	ensureCalendarEventReminders,
	ensureNoteReminders,
} from "@repo/notifications";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handle(request: Request) {
	const authError = requireCronAuth(request);
	if (authError) {
		return authError;
	}

	const now = new Date();
	const calendar = await ensureCalendarEventReminders(now);
	const notes = await ensureNoteReminders(now);

	return NextResponse.json({
		ok: true,
		at: now.toISOString(),
		calendar,
		notes,
	});
}

export const GET = handle;
export const POST = handle;
