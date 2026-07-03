import { createWishlistItemProcedure } from "./procedures/create-item";
import { deleteWishlistItemProcedure } from "./procedures/delete-item";
import { listWishlistItems } from "./procedures/list-items";
import { reorderWishlistItemsProcedure } from "./procedures/reorder-items";
import { updateWishlistItemProcedure } from "./procedures/update-item";

export const wishlistRouter = {
	list: listWishlistItems,
	create: createWishlistItemProcedure,
	update: updateWishlistItemProcedure,
	reorder: reorderWishlistItemsProcedure,
	delete: deleteWishlistItemProcedure,
};
