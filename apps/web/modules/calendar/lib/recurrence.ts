import { Frequency, RRule, rrulestr } from "rrule";

export const RECURRENCE_PRESETS = [
	"NONE",
	"DAILY",
	"WEEKDAYS",
	"WEEKLY",
	"MONTHLY",
	"YEARLY",
	"CUSTOM",
] as const;

export type RecurrencePreset = (typeof RECURRENCE_PRESETS)[number];

const WEEKDAY_RULE = "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR";

export function buildRrule(preset: RecurrencePreset, customRule?: string): string | null {
	switch (preset) {
		case "NONE":
			return null;
		case "DAILY":
			return "FREQ=DAILY";
		case "WEEKDAYS":
			return WEEKDAY_RULE;
		case "WEEKLY":
			return "FREQ=WEEKLY";
		case "MONTHLY":
			return "FREQ=MONTHLY";
		case "YEARLY":
			return "FREQ=YEARLY";
		case "CUSTOM":
			return customRule?.trim() || null;
		default:
			return null;
	}
}

export function detectPreset(rule: string | null | undefined): RecurrencePreset {
	if (!rule) return "NONE";
	const trimmed = rule.trim().toUpperCase();
	if (trimmed === "FREQ=DAILY") return "DAILY";
	if (trimmed === WEEKDAY_RULE) return "WEEKDAYS";
	if (trimmed === "FREQ=WEEKLY") return "WEEKLY";
	if (trimmed === "FREQ=MONTHLY") return "MONTHLY";
	if (trimmed === "FREQ=YEARLY") return "YEARLY";
	return "CUSTOM";
}

export function describeRrule(rule: string | null | undefined, dtstart: Date): string | null {
	if (!rule) return null;
	try {
		const parsed = rrulestr(rule, { dtstart });
		if (parsed instanceof RRule) {
			return parsed.toText();
		}
		return rule;
	} catch {
		return rule;
	}
}

export { Frequency };
