import { z } from "zod";

export const wishlistPrioritySchema = z.enum(["NEED", "WANT", "SOMEDAY"]);
export type WishlistPriorityValue = z.infer<typeof wishlistPrioritySchema>;

export const wishlistStatusSchema = z.enum(["WANTED", "PURCHASED"]);
export type WishlistStatusValue = z.infer<typeof wishlistStatusSchema>;

const currencyCodeSchema = z
	.string()
	.regex(/^[A-Za-z]{3}$/, "Use a 3-letter currency code")
	.transform((v) => v.toUpperCase());

export const wishlistInputSchema = z.object({
	title: z.string().min(1, "Title is required").max(500),
	notes: z.string().max(10_000).nullish(),
	url: z.string().url("Enter a valid link").max(2_000).nullish(),
	price: z.number().finite().min(0).nullish(),
	currency: currencyCodeSchema.nullish(),
	priority: wishlistPrioritySchema.optional(),
});

export type WishlistInput = z.infer<typeof wishlistInputSchema>;

export const wishlistUpdateSchema = z.object({
	id: z.string().min(1),
	title: z.string().min(1).max(500).optional(),
	notes: z.string().max(10_000).nullish(),
	url: z.string().url("Enter a valid link").max(2_000).nullish(),
	price: z.number().finite().min(0).nullish(),
	currency: currencyCodeSchema.nullish(),
	priority: wishlistPrioritySchema.optional(),
	status: wishlistStatusSchema.optional(),
});

export type WishlistUpdate = z.infer<typeof wishlistUpdateSchema>;
