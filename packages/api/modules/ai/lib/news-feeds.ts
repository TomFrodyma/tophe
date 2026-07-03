import { z } from "zod";

import { type FeedSource, isPublicHttpUrl } from "./feeds";

// A user-chosen briefing news source. The url is refused unless it is a public
// http(s) address - feeds are fetched server-side, so this is the SSRF gate
// (checked here at save time and again in feeds.ts before every fetch).
export const newsFeedSchema = z.object({
	source: z.string().trim().min(1).max(60),
	url: z
		.string()
		.trim()
		.max(300)
		.refine(isPublicHttpUrl, "Must be a public http(s) URL"),
	category: z.string().trim().max(60).optional(),
});

export const newsFeedListSchema = z.array(newsFeedSchema).max(20);

export type NewsFeed = z.infer<typeof newsFeedSchema>;

/**
 * The AgentProfile.newsFeeds Json column, defensively parsed. Malformed or
 * empty means "no selection" - callers fall back to the curated default set.
 */
export function parseStoredNewsFeeds(value: unknown): FeedSource[] {
	const parsed = newsFeedListSchema.safeParse(value);
	if (!parsed.success) {
		return [];
	}
	return parsed.data.map((f) => ({
		source: f.source,
		url: f.url,
		category: f.category?.trim() || "custom",
	}));
}
