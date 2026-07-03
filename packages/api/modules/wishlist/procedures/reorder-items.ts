import { reorderWishlistItems } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const reorderWishlistItemsProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/wishlist/reorder",
		tags: ["Wishlist"],
		summary: "Set the manual order of wishlist items",
	})
	.input(
		z.object({
			ids: z.array(z.string()).min(1).max(500),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		await reorderWishlistItems(user.id, input.ids);
		return { ok: true as const };
	});
