import { createWishlistItem } from "@repo/database";

import { protectedProcedure } from "../../../orpc/procedures";
import { wishlistInputSchema } from "../types";

export const createWishlistItemProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/wishlist",
		tags: ["Wishlist"],
		summary: "Create a wishlist item",
	})
	.input(wishlistInputSchema)
	.handler(async ({ input, context: { user } }) => {
		const item = await createWishlistItem({
			userId: user.id,
			title: input.title,
			notes: input.notes ?? null,
			url: input.url ?? null,
			price: input.price ?? null,
			currency: input.currency ?? null,
			priority: input.priority ?? "WANT",
		});
		return {
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
		};
	});
