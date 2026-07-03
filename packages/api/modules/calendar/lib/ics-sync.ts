import { lookup } from "node:dns/promises";

import type { IncomingSyncedEvent } from "@repo/database";
import ical from "node-ical";

const FETCH_TIMEOUT_MS = 30_000;
const MAX_ICS_BYTES = 25 * 1024 * 1024;
const PAST_WINDOW_DAYS = 30;
const FUTURE_WINDOW_DAYS = 365;

export class IcsSyncError extends Error {
	constructor(
		message: string,
		readonly code:
			| "INVALID_URL"
			| "FETCH_FAILED"
			| "TOO_LARGE"
			| "PARSE_FAILED"
			| "NOT_ICS",
	) {
		super(message);
		this.name = "IcsSyncError";
	}
}

export function assertHttpsUrl(url: string): URL {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		throw new IcsSyncError("URL is not valid", "INVALID_URL");
	}
	if (parsed.protocol !== "https:") {
		throw new IcsSyncError("Calendar URL must use https://", "INVALID_URL");
	}
	if (parsed.username || parsed.password) {
		throw new IcsSyncError("Credentials in URL are not allowed", "INVALID_URL");
	}
	return parsed;
}

function isPrivateIp(address: string): boolean {
	if (!address) return true;
	if (address === "127.0.0.1" || address === "::1" || address === "0.0.0.0") return true;
	if (address.startsWith("169.254.")) return true;
	const v4 = address.split(".").map(Number);
	if (v4.length === 4 && v4.every((n) => Number.isFinite(n))) {
		if (v4[0] === 10) return true;
		if (v4[0] === 172 && v4[1] >= 16 && v4[1] <= 31) return true;
		if (v4[0] === 192 && v4[1] === 168) return true;
		if (v4[0] === 100 && v4[1] >= 64 && v4[1] <= 127) return true;
		if (v4[0] === 0) return true;
		if (v4[0] === 127) return true;
	}
	const lower = address.toLowerCase();
	if (lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:")) {
		return true;
	}
	return false;
}

async function assertPublicHost(url: URL): Promise<void> {
	try {
		const results = await lookup(url.hostname, { all: true });
		if (!results.length) {
			throw new IcsSyncError("Host could not be resolved", "FETCH_FAILED");
		}
		for (const r of results) {
			if (isPrivateIp(r.address)) {
				throw new IcsSyncError("Host is not publicly routable", "INVALID_URL");
			}
		}
	} catch (err) {
		if (err instanceof IcsSyncError) throw err;
		throw new IcsSyncError("Host could not be resolved", "FETCH_FAILED");
	}
}

async function fetchIcs(url: string): Promise<string> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	try {
		const res = await fetch(url, {
			signal: controller.signal,
			redirect: "error",
			headers: { Accept: "text/calendar, text/plain;q=0.5" },
		});
		if (!res.ok) {
			throw new IcsSyncError(
				`Calendar feed returned ${res.status} ${res.statusText}`,
				"FETCH_FAILED",
			);
		}
		const contentLength = Number(res.headers.get("content-length") ?? 0);
		if (contentLength && contentLength > MAX_ICS_BYTES) {
			throw new IcsSyncError("Calendar feed is too large", "TOO_LARGE");
		}
		const text = await res.text();
		if (text.length > MAX_ICS_BYTES) {
			throw new IcsSyncError("Calendar feed is too large", "TOO_LARGE");
		}
		if (!text.includes("BEGIN:VCALENDAR")) {
			throw new IcsSyncError("URL did not return an iCalendar feed", "NOT_ICS");
		}
		return text;
	} catch (err) {
		if (err instanceof IcsSyncError) throw err;
		if ((err as { name?: string })?.name === "AbortError") {
			throw new IcsSyncError("Fetching the calendar timed out", "FETCH_FAILED");
		}
		throw new IcsSyncError(
			err instanceof Error ? err.message : "Failed to fetch calendar",
			"FETCH_FAILED",
		);
	} finally {
		clearTimeout(timeout);
	}
}

function toDate(value: unknown): Date | null {
	if (value instanceof Date) return value;
	if (typeof value === "string") {
		const d = new Date(value);
		return Number.isNaN(d.getTime()) ? null : d;
	}
	return null;
}

function extractRrule(event: ical.VEvent): string | null {
	const rrule = (event as unknown as { rrule?: { toString: () => string } }).rrule;
	if (!rrule || typeof rrule.toString !== "function") return null;
	const str = rrule.toString();
	const match = str.match(/RRULE:([^\n]+)/);
	if (match) return match[1].trim();
	return str.startsWith("RRULE:") ? str.slice("RRULE:".length).trim() : str.trim();
}

function extractExdates(event: ical.VEvent): Date[] {
	const raw = (event as unknown as { exdate?: Record<string, Date> }).exdate;
	if (!raw || typeof raw !== "object") return [];
	return Object.values(raw)
		.map((v) => toDate(v))
		.filter((v): v is Date => v !== null);
}

function clean(text: unknown, max = 200): string {
	if (typeof text !== "string") return "";
	const trimmed = text.replace(/\s+/g, " ").trim();
	return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

/**
 * Parses the ICS body, strips everything except title / location / times /
 * recurrence, and filters to a bounded window around now.
 */
export function parseIcsStrict(icsText: string): IncomingSyncedEvent[] {
	let parsed: ical.CalendarResponse;
	try {
		parsed = ical.sync.parseICS(icsText);
	} catch (err) {
		throw new IcsSyncError(
			err instanceof Error ? err.message : "Failed to parse calendar",
			"PARSE_FAILED",
		);
	}

	const now = Date.now();
	const lowerBound = now - PAST_WINDOW_DAYS * 24 * 60 * 60 * 1000;
	const upperBound = now + FUTURE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

	const results: IncomingSyncedEvent[] = [];
	const seenIds = new Set<string>();

	for (const key of Object.keys(parsed)) {
		const component = parsed[key];
		if (!component || component.type !== "VEVENT") continue;
		const event = component as ical.VEvent;

		const uid = typeof event.uid === "string" && event.uid ? event.uid : key;
		if (seenIds.has(uid)) continue;

		const start = toDate(event.start);
		const end = toDate(event.end) ?? start;
		if (!start || !end) continue;

		const rrule = extractRrule(event);
		if (!rrule) {
			// One-off events outside our window are dropped.
			if (end.getTime() < lowerBound) continue;
			if (start.getTime() > upperBound) continue;
		}

		const allDay = (event as unknown as { datetype?: string }).datetype === "date";
		const title = clean(event.summary) || "(no title)";
		const location = clean(event.location, 500) || null;

		seenIds.add(uid);
		results.push({
			externalId: uid,
			title,
			location,
			startAt: start,
			endAt: end,
			allDay,
			rrule,
			excludedDates: extractExdates(event),
		});
	}

	return results;
}

export async function fetchAndParseIcs(url: string): Promise<IncomingSyncedEvent[]> {
	const parsed = assertHttpsUrl(url);
	await assertPublicHost(parsed);
	const body = await fetchIcs(url);
	return parseIcsStrict(body);
}

/**
 * Ensure no user-supplied URL leaks into persisted error messages.
 * Strips anything URL-shaped and truncates.
 */
export function sanitizeSyncError(url: string, message: string): string {
	let cleaned = message.replace(url, "[url]");
	cleaned = cleaned.replace(/https?:\/\/\S+/gi, "[url]");
	if (cleaned.length > 300) cleaned = `${cleaned.slice(0, 300)}…`;
	return cleaned;
}
