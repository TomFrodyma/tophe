import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * Shared bearer check for the cron routes. Returns an error response when the
 * request isn't authorized, null when it is. Constant-time comparison so the
 * secret can't be probed byte by byte from response timing.
 */
export function requireCronAuth(request: Request): NextResponse | null {
	const expected = process.env.CRON_SECRET;
	if (!expected) {
		return NextResponse.json({ error: "cron not configured" }, { status: 500 });
	}

	const header = Buffer.from(request.headers.get("authorization") ?? "");
	const wanted = Buffer.from(`Bearer ${expected}`);
	if (header.length !== wanted.length || !timingSafeEqual(header, wanted)) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}

	return null;
}
