import { db } from "../client";
import { Prisma } from "../generated/client";

// ----- Profile (the persona "soul" + core profile) -----

export async function getAgentProfileForUser(userId: string) {
	return await db.agentProfile.findUnique({ where: { userId } });
}

export async function upsertAgentProfile(
	userId: string,
	personaPrompt: string,
	coreProfile: string,
	name: string,
) {
	return await db.agentProfile.upsert({
		where: { userId },
		create: { userId, personaPrompt, coreProfile, name },
		update: { personaPrompt, coreProfile, name },
	});
}

// Drop the cached daily briefing so the next fetch regenerates it (e.g. after the
// interests change). The briefing is a regenerable cache, never source data.
export async function clearDailyBriefing(userId: string) {
	return await db.dailyBriefing.deleteMany({ where: { userId } });
}

// Set only the briefing interests. If no profile row exists yet, create one with
// the caller-supplied persona/core defaults (those columns are required).
export async function updateAgentInterests(
	userId: string,
	interests: string,
	defaults: { personaPrompt: string; coreProfile: string },
	newsFeeds?: Array<{ source: string; url: string; category?: string }>,
) {
	const feeds =
		newsFeeds === undefined ? {} : { newsFeeds: newsFeeds as Prisma.InputJsonValue };
	return await db.agentProfile.upsert({
		where: { userId },
		create: { userId, interests, ...defaults, ...feeds },
		update: { interests, ...feeds },
	});
}

// ----- Memory (auto-captured, keyword recall) -----

export async function listAgentMemoriesForUser(userId: string, limit = 200) {
	return await db.agentMemory.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
		take: limit,
	});
}

export async function searchAgentMemories(userId: string, query: string, limit = 12) {
	const terms = query
		.split(/\s+/)
		.map((t) => t.trim())
		.filter((t) => t.length > 2)
		.slice(0, 8);

	// Keyword OR match. Swap for embeddings/pgvector only if recall
	// quality measurably falls short - keyword covers a single user's memories fine.
	return await db.agentMemory.findMany({
		where: {
			userId,
			...(terms.length
				? {
						OR: terms.map((t) => ({
							content: { contains: t, mode: "insensitive" as const },
						})),
					}
				: {}),
		},
		orderBy: { createdAt: "desc" },
		take: limit,
	});
}

export async function saveAgentMemory(userId: string, content: string, source = "AGENT") {
	return await db.agentMemory.create({ data: { userId, content, source } });
}

export async function deleteAgentMemory(id: string, userId: string) {
	const result = await db.agentMemory.deleteMany({ where: { id, userId } });
	return result.count;
}

export async function clearAgentMemories(userId: string) {
	const result = await db.agentMemory.deleteMany({ where: { userId } });
	return result.count;
}

// ----- Conversations -----

export async function listAgentConversationsForUser(userId: string, limit = 50) {
	return await db.agentConversation.findMany({
		where: { userId },
		orderBy: { updatedAt: "desc" },
		take: limit,
		select: { id: true, title: true, createdAt: true, updatedAt: true },
	});
}

export async function getAgentConversationForUser(id: string, userId: string) {
	return await db.agentConversation.findFirst({
		where: { id, userId },
		include: { messages: { orderBy: { order: "asc" } } },
	});
}

export async function deleteAgentConversation(id: string, userId: string) {
	const result = await db.agentConversation.deleteMany({ where: { id, userId } });
	return result.count;
}

interface StoredMessage {
	id: string;
	role: string;
	parts: unknown;
}

/**
 * Replace the full message list for a conversation in one transaction. The id is
 * client-generated; we verify it isn't owned by a different user before writing
 * (cross-user write guard), then rewrite all rows.
 *
 * Rewrites every message each turn instead of appending. Fine at
 * single-user scale; switch to append-by-id if one thread ever gets very long.
 */
export async function saveAgentConversation({
	id,
	userId,
	title,
	messages,
}: {
	id: string;
	userId: string;
	title?: string | null;
	messages: StoredMessage[];
}) {
	return await db.$transaction(async (tx) => {
		const existing = await tx.agentConversation.findUnique({
			where: { id },
			select: { userId: true },
		});
		if (existing && existing.userId !== userId) {
			throw new Error("Conversation id belongs to another user");
		}

		await tx.agentConversation.upsert({
			where: { id },
			create: { id, userId, title: title ?? null },
			update: {
				...(title !== undefined && title !== null ? { title } : {}),
				updatedAt: new Date(),
			},
		});

		await tx.agentMessage.deleteMany({ where: { conversationId: id } });
		await tx.agentMessage.createMany({
			data: messages.map((m, i) => ({
				// Ids are client/stream-supplied; never let a missing one poison the
				// globally-unique column (an empty id once blocked all saves).
				id: m.id || crypto.randomUUID(),
				conversationId: id,
				role: m.role,
				parts: m.parts as Prisma.InputJsonValue,
				order: i,
			})),
		});
		return messages.length;
	});
}
