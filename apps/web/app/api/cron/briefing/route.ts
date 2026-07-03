import { requireCronAuth } from "../cron-auth";
import { ensureDailyBriefingForUser } from "@repo/api/modules/ai/lib/briefing";
import { db } from "@repo/database";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// One Sonnet call + feed fetches per user, ~20s; headroom for a few users.
export const maxDuration = 120;

// Builds each user's daily briefing and sends the "ready" notification at ~10:00
// in their own timezone. Run this hourly; the local-hour gate fires once in the
// window (DST-safe), and ensureDailyBriefingForUser is idempotent per local day,
// so the later runs in the window are cheap cache no-ops that don't re-notify.
async function handle(request: Request) {
	const authError = requireCronAuth(request);
	if (authError) {
		return authError;
	}

	const users = await db.user.findMany({ select: { id: true, timezone: true } });
	const now = new Date();

	const results = await Promise.allSettled(
		users.map(async (u) => {
			const tz = u.timezone ?? "UTC";
			const hour = Number(
				new Intl.DateTimeFormat("en-GB", {
					timeZone: tz,
					hour: "2-digit",
					hour12: false,
				}).format(now),
			);
			// Build + notify at 10:00; later runs in the window hit the cache and no-op.
			if (hour < 10 || hour > 12) return "skipped";
			await ensureDailyBriefingForUser(u.id, now, true);
			return "built";
		}),
	);

	const built = results.filter((r) => r.status === "fulfilled" && r.value === "built").length;
	const skipped = results.filter((r) => r.status === "fulfilled" && r.value === "skipped").length;
	const failed = results.filter((r) => r.status === "rejected").length;

	return NextResponse.json({
		ok: true,
		users: users.length,
		built,
		skipped,
		failed,
		at: now.toISOString(),
	});
}

export const GET = handle;
export const POST = handle;
