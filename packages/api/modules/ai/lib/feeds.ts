// Feed plumbing for the morning briefing's news section.
//
// Security note: feed content is fully untrusted external input (anyone can post
// to Hacker News or a blog). It is only ever handed to the model inside the USER
// turn, labelled as data, and the model selects items by numeric id - it never
// emits a URL. Titles/links are resolved back from the trusted list here, so the
// model cannot fabricate or tamper with a link. URLs are scheme-checked before
// they are ever rendered as anchors.

import { logger } from "@repo/logs";

export interface FeedSource {
	source: string;
	url: string;
	// Rough bucket, shown to the model so it can balance the edition. Not authoritative.
	category: string;
}

export interface FeedItem {
	id: number;
	source: string;
	category: string;
	title: string;
	url: string;
	snippet: string;
	image: string | null;
	isoDate: string | null;
}

// A US-default mix: national news, politics, business, world, and tech. The
// user's own interests (set in the briefing settings) steer ranking.
// No API keys; a dead feed just drops out and the briefing degrades gracefully.
// Users can replace this set from the briefing settings (AgentProfile.newsFeeds);
// an empty selection falls back to this list.
export const FEEDS: FeedSource[] = [
	{
		source: "NPR",
		url: "https://feeds.npr.org/1001/rss.xml",
		category: "US / national",
	},
	{
		source: "The New York Times",
		url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
		category: "US / national",
	},
	{
		source: "The Washington Post",
		url: "https://feeds.washingtonpost.com/rss/national",
		category: "US / national",
	},
	{
		source: "Politico",
		url: "https://rss.politico.com/politics-news.xml",
		category: "US politics",
	},
	{
		source: "CNBC",
		url: "https://www.cnbc.com/id/100003114/device/rss/rss.html",
		category: "business / markets",
	},
	{
		source: "BBC World",
		url: "https://feeds.bbci.co.uk/news/world/rss.xml",
		category: "World",
	},
	{ source: "Hacker News", url: "https://hnrss.org/frontpage", category: "tech / startups" },
	{
		source: "Ars Technica",
		url: "https://feeds.arstechnica.com/arstechnica/index",
		category: "tech",
	},
];

const PER_FEED = 6; // newest N items per feed
const MAX_CANDIDATES = 48; // pool handed to the model
const SNIPPET_MAX = 280;
const FETCH_TIMEOUT_MS = 7000;
const USER_AGENT = "Tophe-Briefing/1.0";

const ENTITIES: Record<string, string> = {
	"&amp;": "&",
	"&lt;": "<",
	"&gt;": ">",
	"&quot;": '"',
	"&apos;": "'",
	"&#39;": "'",
	"&nbsp;": " ",
};

function decodeEntities(text: string): string {
	return text
		.replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeCodePoint(Number.parseInt(hex, 16)))
		.replace(/&#(\d+);/g, (_, dec) => safeCodePoint(Number.parseInt(dec, 10)))
		.replace(/&[a-z]+;|&#39;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
}

function safeCodePoint(code: number): string {
	if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return "";
	try {
		return String.fromCodePoint(code);
	} catch {
		return "";
	}
}

function stripTags(html: string): string {
	return html.replace(/<[^>]*>/g, " ");
}

function unwrapCdata(text: string): string {
	return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

// Order matters: unwrap CDATA, then decode entities (so entity-encoded HTML like
// `&lt;p&gt;` turns into real tags), then strip those tags. Doing it the other way
// leaves encoded markup in the text. Em/en dashes are stripped too, to match the
// briefing's no-dash house style (headlines included).
function clean(raw: string | null | undefined): string {
	if (!raw) return "";
	return stripTags(decodeEntities(unwrapCdata(raw)))
		.replace(/\s*[—–]\s*/g, ", ")
		.replace(/\s+/g, " ")
		.trim();
}

function firstMatch(block: string, re: RegExp): string | null {
	return re.exec(block)?.[1] ?? null;
}

// Atom feeds carry several <link> tags (self, alternate, ...). Prefer alternate,
// never self; RSS uses plain <link>url</link>.
function extractLink(block: string): string | null {
	let href: string | null = null;
	for (const m of block.matchAll(/<link\b([^>]*?)\/?>/gi)) {
		const attrs = m[1];
		const h = /\bhref=["']([^"']+)["']/i.exec(attrs)?.[1];
		if (!h) continue;
		const rel = /\brel=["']([^"']+)["']/i.exec(attrs)?.[1]?.toLowerCase();
		if (rel === "self") continue;
		if (!href || rel === "alternate") href = h;
		if (rel === "alternate") break;
	}
	if (href) return decodeEntities(href).trim();
	const rss = firstMatch(block, /<link>([\s\S]*?)<\/link>/i);
	return rss ? decodeEntities(rss).trim() : null;
}

// A lead image for the card, if the feed offers one. Tries the structured media
// tags first (reliable), then the first <img> in any embedded HTML. Tracking
// pixels are filtered out. Returns a safe http(s) url or null.
function extractImage(block: string): string | null {
	const html = decodeEntities(unwrapCdata(block));
	const candidates = [
		/<media:content\b[^>]*\burl=["']([^"']+)["']/i.exec(block)?.[1],
		/<media:thumbnail\b[^>]*\burl=["']([^"']+)["']/i.exec(block)?.[1],
		/<enclosure\b[^>]*\btype=["']image\/[^"']*["'][^>]*\burl=["']([^"']+)["']/i.exec(
			block,
		)?.[1],
		/<enclosure\b[^>]*\burl=["']([^"']+)["'][^>]*\btype=["']image\//i.exec(block)?.[1],
		/<img\b[^>]*\bsrc=["']([^"']+)["']/i.exec(html)?.[1],
	];
	for (const raw of candidates) {
		if (!raw) continue;
		const url = decodeEntities(raw).trim();
		if (!isSafeHttpUrl(url)) continue;
		if (/feedburner|doubleclick|\bpixel\b|\/1x1\b/i.test(url)) continue; // trackers
		return url;
	}
	return null;
}

// Only http(s) links ever reach the UI. Blocks javascript:/data: and friends.
export function isSafeHttpUrl(url: string): boolean {
	try {
		const u = new URL(url);
		return u.protocol === "http:" || u.protocol === "https:";
	} catch {
		return false;
	}
}

// SSRF guard for server-side fetches: article pages (HN links out to arbitrary
// sites) and user-chosen feed urls (validated with this at save time AND before
// every fetch hop). String checks only, no DNS resolution - a hostname
// whose A record points at a private IP still passes. Good enough for public
// news urls on a single-user box; resolve + pin the IP before any multi-user
// exposure.
export function isPublicHttpUrl(url: string): boolean {
	try {
		const u = new URL(url);
		if (u.protocol !== "http:" && u.protocol !== "https:") return false;
		// The resolver honors a trailing dot ("localhost." is localhost), so
		// normalize before the name checks.
		const h = u.hostname.toLowerCase().replace(/\.$/, "");
		if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return false;
		if (h.startsWith("[") || h === "::1") return false; // ipv6 literal
		if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h)) return false;
		if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
		if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(h)) return false; // CGNAT / Tailscale
		return true;
	} catch {
		return false;
	}
}

// fetch() with the SSRF gate applied to EVERY hop. Undici's auto-follow would
// happily leave a validated public host for a Location: http://localhost/...,
// so redirects are walked by hand and each target is re-checked.
async function fetchPublicUrl(
	url: string,
	init: RequestInit,
	maxHops = 3,
): Promise<Response | null> {
	let current = url;
	for (let hop = 0; hop <= maxHops; hop++) {
		if (!isPublicHttpUrl(current)) return null;
		const res = await fetch(current, { ...init, redirect: "manual" });
		if (res.status >= 300 && res.status < 400) {
			const location = res.headers.get("location");
			if (!location) return null;
			current = new URL(location, current).toString();
			continue;
		}
		return res;
	}
	return null; // redirect chain too long
}

// Pull an og:image / twitter:image off an article page. Used to give cards a
// picture when the feed itself carries none (TechCrunch, NL Times, HN links).
// Bounded: one short fetch, html only, capped read, failures swallowed.
export async function fetchArticleImage(url: string): Promise<string | null> {
	try {
		const res = await fetchPublicUrl(url, {
			signal: AbortSignal.timeout(3500),
			headers: { "user-agent": USER_AGENT, accept: "text/html" },
		});
		if (!res?.ok) return null;
		if (!(res.headers.get("content-type") ?? "").includes("html")) return null;
		const html = (await res.text()).slice(0, 200_000);
		const og =
			/<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]*\bcontent=["']([^"']+)["']/i.exec(
				html,
			)?.[1] ??
			/<meta[^>]+\bcontent=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i.exec(
				html,
			)?.[1] ??
			/<meta[^>]+(?:property|name)=["']twitter:image["'][^>]*\bcontent=["']([^"']+)["']/i.exec(
				html,
			)?.[1];
		if (!og) return null;
		const abs = new URL(decodeEntities(og).trim(), url).toString();
		return isSafeHttpUrl(abs) ? abs : null;
	} catch {
		return null;
	}
}

// Minimal RSS + Atom parser. Regex, not a real XML parser - it covers
// <item>/<entry>, CDATA titles, RSS + Atom links, and the common date tags, which
// is enough for the mainstream feeds above. If an exotic feed breaks, swap in
// `rss-parser` rather than growing this. Returns raw items (no ids yet).
export function parseFeed(xml: string, source: string, category: string): Omit<FeedItem, "id">[] {
	const items: Omit<FeedItem, "id">[] = [];
	for (const block of xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)) {
		const body = block[0];
		const title = clean(firstMatch(body, /<title[^>]*>([\s\S]*?)<\/title>/i));
		const url = extractLink(body);
		if (!title || !url || !isSafeHttpUrl(url)) continue;
		const rawSnippet =
			firstMatch(body, /<description[^>]*>([\s\S]*?)<\/description>/i) ??
			firstMatch(body, /<summary[^>]*>([\s\S]*?)<\/summary>/i) ??
			firstMatch(body, /<content[^>]*>([\s\S]*?)<\/content>/i);
		const isoDate =
			firstMatch(body, /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ??
			firstMatch(body, /<published[^>]*>([\s\S]*?)<\/published>/i) ??
			firstMatch(body, /<updated[^>]*>([\s\S]*?)<\/updated>/i) ??
			firstMatch(body, /<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i);
		const parsedDate = isoDate ? new Date(isoDate.trim()) : null;
		items.push({
			source,
			category,
			title: title.slice(0, 200),
			url,
			snippet: clean(rawSnippet).slice(0, SNIPPET_MAX),
			image: extractImage(body),
			isoDate:
				parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null,
		});
	}
	return items;
}

async function fetchOne(feed: FeedSource): Promise<Omit<FeedItem, "id">[]> {
	try {
		const res = await fetchPublicUrl(feed.url, {
			cache: "no-store",
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			headers: { "user-agent": USER_AGENT },
		});
		if (!res?.ok) return [];
		const xml = await res.text();
		return parseFeed(xml, feed.source, feed.category).slice(0, PER_FEED);
	} catch (error) {
		logger.warn(`Briefing feed failed: ${feed.source}`, error);
		return [];
	}
}

// Fetch every feed in parallel, dedup by URL, then interleave round-robin across
// sources so the pool is balanced - one high-volume tech feed can't crowd out the
// slower general-news sources, and feeds whose dates don't parse aren't unfairly
// sunk. Each source's items stay in feed order (newest-first).
// Assigns stable ids the model selects from. Failures are swallowed per-feed.
export async function fetchFeedCandidates(feeds: FeedSource[] = FEEDS): Promise<FeedItem[]> {
	const perSource = await Promise.all(feeds.map(fetchOne));

	const seen = new Set<string>();
	const queues = perSource.map((items) =>
		items.filter((item) => {
			if (seen.has(item.url)) return false;
			seen.add(item.url);
			return true;
		}),
	);

	const interleaved: Omit<FeedItem, "id">[] = [];
	for (let round = 0; interleaved.length < MAX_CANDIDATES; round++) {
		let added = false;
		for (const q of queues) {
			if (round < q.length) {
				interleaved.push(q[round]);
				added = true;
				if (interleaved.length >= MAX_CANDIDATES) break;
			}
		}
		if (!added) break; // every queue exhausted
	}

	return interleaved.map((item, id) => ({ ...item, id }));
}
