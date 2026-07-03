export function formatMoney(
	amount: string | number,
	currency = "EUR",
	options: Intl.NumberFormatOptions = {},
) {
	const value = typeof amount === "string" ? Number(amount) : amount;
	if (!Number.isFinite(value)) {
		return String(amount);
	}
	return new Intl.NumberFormat("en-IE", {
		style: "currency",
		currency,
		maximumFractionDigits: 0,
		...options,
	}).format(value);
}

export function formatMonthYear(iso: string) {
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function formatRoleRange(startIso: string, endIso: string | null) {
	const start = formatMonthYear(startIso);
	const end = endIso ? formatMonthYear(endIso) : "Present";
	return `${start} – ${end}`;
}

/** Human duration between two dates, e.g. "1 yr 2 mos" or "8 mos". */
export function formatDuration(startIso: string, endIso: string | null) {
	const start = new Date(startIso);
	const end = endIso ? new Date(endIso) : new Date();
	let months =
		(end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
	if (months < 0) {
		months = 0;
	}
	months += 1; // inclusive of the start month
	const years = Math.floor(months / 12);
	const rem = months % 12;
	const parts: string[] = [];
	if (years > 0) {
		parts.push(`${years} yr${years > 1 ? "s" : ""}`);
	}
	if (rem > 0) {
		parts.push(`${rem} mo${rem > 1 ? "s" : ""}`);
	}
	return parts.join(" ") || "1 mo";
}

/** Total professional span in whole years across all roles (min start → now/latest end). */
export function totalYears(roles: { startDate: string; endDate: string | null }[]) {
	if (roles.length === 0) {
		return 0;
	}
	const starts = roles.map((r) => new Date(r.startDate).getTime());
	const earliest = Math.min(...starts);
	const now = Date.now();
	const years = (now - earliest) / (1000 * 60 * 60 * 24 * 365.25);
	return Math.max(0, Math.round(years * 10) / 10);
}
