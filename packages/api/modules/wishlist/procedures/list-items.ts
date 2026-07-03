import { listWishlistForUser } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { wishlistPrioritySchema, wishlistStatusSchema } from "../types";

export const listWishlistItems = protectedProcedure
	.route({
		method: "GET",
		path: "/wishlist",
		tags: ["Wishlist"],
		summary: "List wishlist items",
	})
	.input(
		z.object({
			status: wishlistStatusSchema.nullish(),
			priority: wishlistPrioritySchema.nullish(),
			search: z.string().max(200).optional(),
			take: z.number().int().min(1).max(1000).optional(),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const items = await listWishlistForUser(user.id, input.take ?? 500, {
			status: input.status ?? undefined,
			priority: input.priority ?? undefined,
			search: input.search,
		});
		return items.map((item) => ({
			id: item.id,
			title: item.title,
			notes: item.notes,
			url: item.url,
			price: item.price,
			currency: item.currency,
			priority: item.priority as string,
			status: item.status as string,
			purchasedAt: item.purchasedAt,
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
		}));
	});
