import { db } from "../client";

export interface NoteFilters {
	search?: string;
	withReminder?: boolean;
}

function buildNoteWhere(userId: string, filters: NoteFilters = {}) {
	return {
		userId,
		...(filters.withReminder === true ? { remindAt: { not: null } } : {}),
		...(filters.withReminder === false ? { remindAt: null } : {}),
		...(filters.search
			? {
					OR: [
						{ title: { contains: filters.search, mode: "insensitive" as const } },
						{ content: { contains: filters.search, mode: "insensitive" as const } },
					],
				}
			: {}),
	};
}

export async function listNotesForUser(
	userId: string,
	limit = 100,
	filters: NoteFilters = {},
) {
	return await db.note.findMany({
		where: buildNoteWhere(userId, filters),
		// Pinned first (in their manual order), then the usual reminder/recency sort.
		orderBy: [
			{ pinOrder: { sort: "asc", nulls: "last" } },
			{ remindAt: "asc" },
			{ createdAt: "desc" },
		],
		take: limit,
	});
}

export async function getNoteForUser(id: string, userId: string) {
	return await db.note.findFirst({
		where: { id, userId },
	});
}

export async function createNote({
	userId,
	title,
	content,
	remindAt,
}: {
	userId: string;
	title: string;
	content: string;
	remindAt?: Date | null;
}) {
	return await db.note.create({
		data: {
			userId,
			title,
			content,
			remindAt: remindAt ?? null,
		},
	});
}

export async function updateNote({
	id,
	userId,
	title,
	content,
	remindAt,
	pinOrder,
}: {
	id: string;
	userId: string;
	title?: string;
	content?: string;
	remindAt?: Date | null;
	pinOrder?: number | null;
}) {
	const result = await db.note.updateMany({
		where: { id, userId },
		data: {
			...(title !== undefined ? { title } : {}),
			...(content !== undefined ? { content } : {}),
			...(remindAt !== undefined ? { remindAt } : {}),
			...(pinOrder !== undefined ? { pinOrder } : {}),
		},
	});
	return result.count;
}

/** Persist the drag order of the pinned section: pinOrder 1..n in the given
 *  sequence. Scoped to the caller, so foreign ids are silently skipped. */
export async function reorderNotePins(userId: string, ids: string[]) {
	await db.$transaction(
		ids.map((id, index) =>
			db.note.updateMany({
				where: { id, userId },
				data: { pinOrder: index + 1 },
			}),
		),
	);
}

export async function deleteNote(id: string, userId: string) {
	const result = await db.note.deleteMany({
		where: { id, userId },
	});
	return result.count;
}
