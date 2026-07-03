export type WishlistPriority = "NEED" | "WANT" | "SOMEDAY";
export type WishlistStatus = "WANTED" | "PURCHASED";

export interface WishlistItemLite {
	id: string;
	title: string;
	notes: string | null;
	url: string | null;
	price: number | null;
	currency: string | null;
	priority: string;
	status: string;
	purchasedAt: Date | string | null;
	createdAt: Date | string;
	updatedAt: Date | string;
}

/** Display order - top to bottom. Matches the Prisma enum order so the
 *  server sorts the same way the UI groups. */
export const PRIORITY_ORDER: WishlistPriority[] = ["NEED", "WANT", "SOMEDAY"];

/** Dot + accent styling per tier. `labelKey` resolves under `wishlist.priority`. */
export const PRIORITY_META: Record<
	WishlistPriority,
	{ labelKey: string; dot: string }
> = {
	NEED: { labelKey: "need", dot: "bg-pop-accent" },
	WANT: { labelKey: "want", dot: "bg-pop-primary" },
	SOMEDAY: { labelKey: "someday", dot: "bg-muted-foreground/40" },
};

export function isWishlistPriority(value: string): value is WishlistPriority {
	return value === "NEED" || value === "WANT" || value === "SOMEDAY";
}
