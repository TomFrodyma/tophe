import {
	type WishlistPriority,
	type WishlistStatus,
	updateWishlistItem,
} from "@repo/database";
import { ORPCError } from "@orpc/server";

import { protectedProcedure } from "../../../orpc/procedures";
import { wishlistUpdateSchema } from "../types";

export const updateWishlistItemProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/wishlist/{id}",
		tags: ["Wishlist"],
		summary: "Update a wishlist item",
	})
	.input(wishlistUpdateSchema)
	.handler(async ({ input, context: { user } }) => {
		const count = await updateWishlistItem({
			id: input.id,
			userId: user.id,
			title: input.title,
			notes: input.notes,
			url: input.url,
			price: input.price,
			currency: input.currency,
			priority: input.priority as WishlistPriority | undefined,
			status: input.status as WishlistStatus | undefined,
		});
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const };
	});
