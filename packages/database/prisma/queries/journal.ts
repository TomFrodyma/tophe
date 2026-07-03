import { db } from "../client";
import type { JournalMood } from "../generated/client";

export interface JournalEntryFilters {
	search?: string;
	mood?: JournalMood | null;
	onlyDaily?: boolean;
	from?: Date;
	to?: Date;
}

function buildEntryWhere(userId: string, filters: JournalEntryFilters = {}) {
	return {
		userId,
		...(filters.onlyDaily ? { isDaily: true } : {}),
		...(filters.mood ? { mood: filters.mood } : {}),
		...(filters.search
			? {
					OR: [
						{ title: { contains: filters.search, mode: "insensitive" as const } },
						{ content: { contains: filters.search, mode: "insensitive" as const } },
					],
				}
			: {}),
		...(filters.from || filters.to
			? {
					createdAt: {
						...(filters.from ? { gte: filters.from } : {}),
						...(filters.to ? { lt: filters.to } : {}),
					},
				}
			: {}),
	};
}

export async function listJournalEntriesForUser(
	userId: string,
	limit = 100,
	filters: JournalEntryFilters = {},
) {
	return await db.journalEntry.findMany({
		where: buildEntryWhere(userId, filters),
		orderBy: { createdAt: "desc" },
		take: limit,
	});
}

export async function getJournalEntriesInRange(
	userId: string,
	from: Date,
	to: Date,
) {
	return await db.journalEntry.findMany({
		where: buildEntryWhere(userId, { from, to }),
		orderBy: { createdAt: "asc" },
	});
}

export async function getJournalEntryForUser(id: string, userId: string) {
	return await db.journalEntry.findFirst({
		where: { id, userId },
	});
}

export async function createJournalEntry({
	userId,
	title,
	content,
	mood,
	createdAt,
}: {
	userId: string;
	title: string;
	content: string;
	mood?: JournalMood | null;
	createdAt?: Date;
}) {
	return await db.journalEntry.create({
		data: {
			userId,
			title,
			content,
			mood: mood ?? null,
			...(createdAt ? { createdAt } : {}),
		},
	});
}

export async function updateJournalEntry({
	id,
	userId,
	title,
	content,
	mood,
	createdAt,
}: {
	id: string;
	userId: string;
	title?: string;
	content?: string;
	mood?: JournalMood | null;
	createdAt?: Date;
}) {
	const result = await db.journalEntry.updateMany({
		where: { id, userId },
		data: {
			...(title !== undefined ? { title } : {}),
			...(content !== undefined ? { content } : {}),
			...(mood !== undefined ? { mood } : {}),
			...(createdAt !== undefined ? { createdAt } : {}),
		},
	});
	return result.count;
}

export async function deleteJournalEntry(id: string, userId: string) {
	const result = await db.journalEntry.deleteMany({
		where: { id, userId },
	});
	return result.count;
}

export async function findTodayJournalEntry(userId: string, now = new Date()) {
	const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const end = new Date(start);
	end.setDate(end.getDate() + 1);

	return await db.journalEntry.findFirst({
		where: {
			userId,
			isDaily: true,
			createdAt: { gte: start, lt: end },
		},
		orderBy: { createdAt: "desc" },
	});
}

export async function findOrCreateTodayJournalEntry({
	userId,
	title,
	now = new Date(),
}: {
	userId: string;
	title: string;
	now?: Date;
}) {
	const existing = await findTodayJournalEntry(userId, now);
	if (existing) return existing;

	return await db.journalEntry.create({
		data: {
			userId,
			title,
			content: "",
			isDaily: true,
		},
	});
}
