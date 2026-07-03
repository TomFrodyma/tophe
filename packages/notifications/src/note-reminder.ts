import { db } from "@repo/database";

import { createNotification } from "./create-notification";

/** How far back a missed cron run can be recovered. */
const LOOKBACK_MS = 15 * 60 * 1000;
const SAFETY_CAP = 100;

/**
 * Scans notes with `remindAt` due within the lookback window and fires a notification once.
 * Idempotent - uses Notification.data.noteId to dedupe.
 */
export async function ensureNoteReminders(
	now: Date = new Date(),
): Promise<{ checked: number; created: number; capped: boolean }> {
	const lookbackFrom = new Date(now.getTime() - LOOKBACK_MS);

	const notes = await db.note.findMany({
		where: {
			remindAt: { gte: lookbackFrom, lte: now },
		},
		select: {
			id: true,
			userId: true,
			title: true,
			content: true,
			remindAt: true,
		},
	});

	if (notes.length === 0) {
		return { checked: 0, created: 0, capped: false };
	}

	const recent = await db.notification.findMany({
		where: {
			type: "MEMO_REMINDER",
			createdAt: { gte: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
		},
		select: { data: true, userId: true },
	});
	const alreadySent = new Set<string>();
	for (const r of recent) {
		if (!r.data || typeof r.data !== "object" || Array.isArray(r.data)) continue;
		const d = r.data as { noteId?: unknown; memoId?: unknown };
		const id =
			typeof d.noteId === "string"
				? d.noteId
				: typeof d.memoId === "string"
					? d.memoId
					: null;
		if (id) {
			alreadySent.add(`${r.userId}|${id}`);
		}
	}

	let created = 0;
	let capped = false;

	for (const note of notes) {
		const key = `${note.userId}|${note.id}`;
		if (alreadySent.has(key)) continue;

		if (created >= SAFETY_CAP) {
			capped = true;
			return { checked: notes.length, created, capped };
		}

		const preview = note.content.trim().slice(0, 200);

		await createNotification({
			userId: note.userId,
			type: "MEMO_REMINDER",
			link: `/notes/${note.id}`,
			data: {
				noteId: note.id,
				title: note.title,
				headline: note.title,
				message: preview || "Note reminder.",
			},
		});
		alreadySent.add(key);
		created++;
	}

	return { checked: notes.length, created, capped };
}
