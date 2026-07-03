import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchArticleImage, isPublicHttpUrl, isSafeHttpUrl, parseFeed } from "./feeds";

const RSS = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>Channel Title</title>
  <item>
    <title><![CDATA[Anthropic ships a thing & it's big]]></title>
    <link>https://example.com/a</link>
    <description>&lt;p&gt;Some &amp; summary&lt;/p&gt;</description>
    <media:content url="https://example.com/lead.jpg" medium="image"/>
    <pubDate>Tue, 17 Jun 2026 09:00:00 GMT</pubDate>
  </item>
  <item>
    <title>Second story</title>
    <link>javascript:alert(1)</link>
    <description>blocked link</description>
  </item>
</channel></rss>`;

const ATOM = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Blog</title>
  <entry>
    <title>LLM evals, revisited</title>
    <link rel="self" href="https://example.com/self"/>
    <link rel="alternate" href="https://example.com/post"/>
    <summary>How to actually measure them.</summary>
    <published>2026-06-16T12:00:00Z</published>
  </entry>
</feed>`;

describe("parseFeed", () => {
	it("parses RSS items, decodes entities, and skips the channel title", () => {
		const items = parseFeed(RSS, "Test", "tech");
		// The bad-scheme item is dropped, so only the first survives.
		expect(items).toHaveLength(1);
		expect(items[0].title).toBe("Anthropic ships a thing & it's big");
		expect(items[0].url).toBe("https://example.com/a");
		expect(items[0].snippet).toBe("Some & summary");
		expect(items[0].image).toBe("https://example.com/lead.jpg");
		expect(items[0].isoDate).toBe("2026-06-17T09:00:00.000Z");
	});

	it("pulls an image from an <img> in entity-encoded description HTML", () => {
		const rss = `<rss><channel><item>
			<title>Has image</title>
			<link>https://example.com/x</link>
			<description>&lt;img src="https://example.com/inline.png"/&gt;&lt;p&gt;hi&lt;/p&gt;</description>
		</item></channel></rss>`;
		const items = parseFeed(rss, "Test", "tech");
		expect(items[0].image).toBe("https://example.com/inline.png");
	});

	it("parses Atom entries and prefers the alternate link over self", () => {
		const items = parseFeed(ATOM, "Blog", "AI / LLM dev");
		expect(items).toHaveLength(1);
		expect(items[0].url).toBe("https://example.com/post");
		expect(items[0].title).toBe("LLM evals, revisited");
	});
});

describe("isSafeHttpUrl", () => {
	it("allows http(s) and blocks everything else", () => {
		expect(isSafeHttpUrl("https://x.com")).toBe(true);
		expect(isSafeHttpUrl("http://x.com")).toBe(true);
		expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
		expect(isSafeHttpUrl("data:text/html,x")).toBe(false);
		expect(isSafeHttpUrl("not a url")).toBe(false);
	});
});

describe("isPublicHttpUrl", () => {
	it.each([
		"https://hnrss.org/frontpage",
		"http://93.184.216.34/feed",
	])("allows public %s", (url) => {
		expect(isPublicHttpUrl(url)).toBe(true);
	});

	it.each([
		"http://localhost/feed",
		"http://localhost./feed", // trailing dot must not defeat the name check
		"http://svc.internal./feed",
		"http://printer.local./feed",
		"http://127.0.0.1/feed",
		"http://0x7f000001/", // hex ip - URL normalizes to 127.0.0.1
		"http://2130706433/", // decimal ip
		"http://[::1]/feed",
		"http://[::ffff:127.0.0.1]/feed",
		"http://169.254.169.254/latest/meta-data",
		"http://100.100.100.100/feed", // CGNAT / Tailscale MagicDNS
		"ftp://example.com/feed",
	])("refuses %s", (url) => {
		expect(isPublicHttpUrl(url)).toBe(false);
	});
});

describe("redirects stay behind the SSRF gate", () => {
	afterEach(() => vi.unstubAllGlobals());

	it("refuses to follow a redirect to a private host", async () => {
		const calls: string[] = [];
		vi.stubGlobal("fetch", (async (url: RequestInfo | URL) => {
			calls.push(String(url));
			return new Response(null, {
				status: 302,
				headers: { location: "http://localhost/secret" },
			});
		}) as typeof fetch);

		expect(await fetchArticleImage("https://example.com/article")).toBeNull();
		// The private target must never be fetched.
		expect(calls).toEqual(["https://example.com/article"]);
	});

	it("follows a public-to-public redirect", async () => {
		const calls: string[] = [];
		vi.stubGlobal("fetch", (async (url: RequestInfo | URL) => {
			calls.push(String(url));
			if (calls.length === 1) {
				return new Response(null, {
					status: 301,
					headers: { location: "https://example.com/final" },
				});
			}
			return new Response('<meta property="og:image" content="https://example.com/pic.jpg">', {
				status: 200,
				headers: { "content-type": "text/html" },
			});
		}) as typeof fetch);

		expect(await fetchArticleImage("https://example.com/article")).toBe(
			"https://example.com/pic.jpg",
		);
		expect(calls).toEqual(["https://example.com/article", "https://example.com/final"]);
	});
});
