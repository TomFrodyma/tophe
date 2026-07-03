import { db } from "../client";
import type { WishlistPriority, WishlistStatus } from "../generated/client";

export interface WishlistFilters {
	status?: WishlistStatus | null;
	priority?: WishlistPriority | null;
	search?: string;
}

export async function listWishlistForUser(
	userId: string,
	limit = 500,
	filters: WishlistFilters = {},
) {
	return await db.wishlistItem.findMany({
		where: {
			userId,
			...(filters.status ? { status: filters.status } : {}),
			...(filters.priority ? { priority: filters.priority } : {}),
			...(filters.search
				? {
						OR: [
							{ title: { contains: filters.search, mode: "insensitive" as const } },
							{ notes: { contains: filters.search, mode: "insensitive" as const } },
						],
					}
				: {}),
		},
		orderBy: [
			{ status: "asc" },
			{ priority: "asc" },
			{ sortOrder: "asc" },
			{ createdAt: "desc" },
		],
		take: limit,
	});
}

export async function getWishlistItemForUser(id: string, userId: string) {
	return await db.wishlistItem.findFirst({
		where: { id, userId },
	});
}

export async function createWishlistItem({
	userId,
	title,
	notes,
	url,
	price,
	currency,
	priority,
}: {
	userId: string;
	title: string;
	notes?: string | null;
	url?: string | null;
	price?: number | null;
	currency?: string | null;
	priority?: WishlistPriority;
}) {
	return await db.wishlistItem.create({
		data: {
			userId,
			title,
			notes: notes ?? null,
			url: url ?? null,
			price: price ?? null,
			currency: currency ?? null,
			priority: priority ?? "WANT",
		},
	});
}

export async function updateWishlistItem({
	id,
	userId,
	title,
	notes,
	url,
	price,
	currency,
	priority,
	status,
}: {
	id: string;
	userId: string;
	title?: string;
	notes?: string | null;
	url?: string | null;
	price?: number | null;
	currency?: string | null;
	priority?: WishlistPriority;
	status?: WishlistStatus;
}) {
	const data: Record<string, unknown> = {
		...(title !== undefined ? { title } : {}),
		...(notes !== undefined ? { notes } : {}),
		...(url !== undefined ? { url } : {}),
		...(price !== undefined ? { price } : {}),
		...(currency !== undefined ? { currency } : {}),
		...(priority !== undefined ? { priority } : {}),
		...(status !== undefined ? { status } : {}),
	};
	if (status === "PURCHASED") {
		data.purchasedAt = new Date();
	} else if (status === "WANTED") {
		data.purchasedAt = null;
	}
	const result = await db.wishlistItem.updateMany({
		where: { id, userId },
		data,
	});
	return result.count;
}

/** Persist a drag order: sortOrder 1..n in the given sequence. Every write is
 *  scoped to the caller, so foreign ids are silently skipped. */
export async function reorderWishlistItems(userId: string, ids: string[]) {
	await db.$transaction(
		ids.map((id, index) =>
			db.wishlistItem.updateMany({
				where: { id, userId },
				data: { sortOrder: index + 1 },
			}),
		),
	);
}

export async function deleteWishlistItem(id: string, userId: string) {
	const result = await db.wishlistItem.deleteMany({
		where: { id, userId },
	});
	return result.count;
}
