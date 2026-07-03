export interface UserLocalInfo {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	startOfDay: Date;
	endOfDay: Date;
}

function getTimeZoneOffsetMs(utcTimestamp: number, timeZone: string): number {
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat("en-US", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		})
			.formatToParts(new Date(utcTimestamp))
			.map((p) => [p.type, p.value] as const),
	);
	const hour = parts.hour === "24" ? 0 : Number(parts.hour);
	const asUtc = Date.UTC(
		Number(parts.year),
		Number(parts.month) - 1,
		Number(parts.day),
		hour,
		Number(parts.minute),
		Number(parts.second),
	);
	return asUtc - utcTimestamp;
}

export function getUserLocalInfo(now: Date, timeZone: string): UserLocalInfo {
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat("en-US", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		})
			.formatToParts(now)
			.map((p) => [p.type, p.value] as const),
	);
	const year = Number(parts.year);
	const month = Number(parts.month);
	const day = Number(parts.day);
	const hour = parts.hour === "24" ? 0 : Number(parts.hour);
	const minute = Number(parts.minute);

	const naiveUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
	const offset = getTimeZoneOffsetMs(naiveUtc, timeZone);
	const startOfDay = new Date(naiveUtc - offset);
	const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

	return { year, month, day, hour, minute, startOfDay, endOfDay };
}

export const DEFAULT_TIMEZONE = "UTC";
