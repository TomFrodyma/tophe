import { deleteWishlistItem } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const deleteWishlistItemProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/wishlist/{id}",
		tags: ["Wishlist"],
		summary: "Delete a wishlist item",
	})
	.input(z.object({ id: z.string().min(1) }))
	.handler(async ({ input: { id }, context: { user } }) => {
		const count = await deleteWishlistItem(id, user.id);
		if (count === 0) {
			throw new ORPCError("NOT_FOUND");
		}
		return { ok: true as const };
	});
