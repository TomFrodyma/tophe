// The journal anchors a day on the entry's createdAt. These helpers bridge a
// native <input type="date"> (a local "YYYY-MM-DD") and that timestamp, so an
// entry written after midnight can be filed under the right day. The time of
// day is preserved from the existing entry (or "now" for a new one), so nudging
// only the date doesn't reset the clock to midnight.

/** Local "YYYY-MM-DD" for a date input's value. */
export function toDateInputValue(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

/**
 * Combine the picked day with the time-of-day from `base` (the entry's existing
 * createdAt, or now). Returns undefined for an empty/invalid input so the caller
 * can leave the stored date untouched.
 */
export function buildCreatedAt(dateStr: string, base: Date = new Date()): Date | undefined {
	const [y, m, d] = dateStr.split("-").map(Number);
	if (!y || !m || !d) {
		return undefined;
	}
	return new Date(y, m - 1, d, base.getHours(), base.getMinutes(), base.getSeconds());
}
