import { describe, expect, it } from "vitest";

import { newsFeedSchema, parseStoredNewsFeeds } from "./news-feeds";

describe("newsFeedSchema", () => {
	it("accepts a public https feed", () => {
		const r = newsFeedSchema.safeParse({
			source: "Hacker News",
			url: "https://hnrss.org/frontpage",
		});
		expect(r.success).toBe(true);
	});

	it.each([
		"http://localhost/feed",
		"http://127.0.0.1/feed",
		"http://10.0.0.5/feed",
		"http://192.168.1.1/feed",
		"http://172.16.0.1/feed",
		"http://169.254.169.254/latest/meta-data",
		"http://internal.service.internal/feed",
		"javascript:alert(1)",
		"file:///etc/passwd",
		"not a url",
	])("refuses %s (SSRF / scheme gate)", (url) => {
		expect(newsFeedSchema.safeParse({ source: "x", url }).success).toBe(false);
	});

	it("refuses an empty name", () => {
		expect(
			newsFeedSchema.safeParse({ source: "  ", url: "https://example.com/f" }).success,
		).toBe(false);
	});
});

describe("parseStoredNewsFeeds", () => {
	it("maps valid entries and defaults the category", () => {
		const feeds = parseStoredNewsFeeds([
			{ source: "A", url: "https://a.example/feed" },
			{ source: "B", url: "https://b.example/feed", category: "tech" },
		]);
		expect(feeds).toEqual([
			{ source: "A", url: "https://a.example/feed", category: "custom" },
			{ source: "B", url: "https://b.example/feed", category: "tech" },
		]);
	});

	it.each([null, "junk", 42, [{ source: "A" }], [{ source: "A", url: "http://10.0.0.1/x" }]])(
		"returns [] for malformed stored value %j",
		(value) => {
			expect(parseStoredNewsFeeds(value)).toEqual([]);
		},
	);
});
