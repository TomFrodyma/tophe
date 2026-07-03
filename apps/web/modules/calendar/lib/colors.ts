export const CALENDAR_COLORS = [
	"sky",
	"indigo",
	"violet",
	"fuchsia",
	"rose",
	"amber",
	"emerald",
	"teal",
	"slate",
] as const;

export type CalendarColor = (typeof CALENDAR_COLORS)[number];

interface ColorClasses {
	dot: string;
	bg: string;
	bgSoft: string;
	border: string;
	text: string;
	hex: string;
}

export const COLOR_CLASSES: Record<CalendarColor, ColorClasses> = {
	sky: {
		dot: "bg-sky-500",
		bg: "bg-sky-500",
		bgSoft: "bg-sky-500/15 hover:bg-sky-500/25 border-sky-500/30",
		border: "border-sky-500/40",
		text: "text-sky-700 dark:text-sky-300",
		hex: "#0ea5e9",
	},
	indigo: {
		dot: "bg-indigo-500",
		bg: "bg-indigo-500",
		bgSoft: "bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-500/30",
		border: "border-indigo-500/40",
		text: "text-indigo-700 dark:text-indigo-300",
		hex: "#6366f1",
	},
	violet: {
		dot: "bg-violet-500",
		bg: "bg-violet-500",
		bgSoft: "bg-violet-500/15 hover:bg-violet-500/25 border-violet-500/30",
		border: "border-violet-500/40",
		text: "text-violet-700 dark:text-violet-300",
		hex: "#8b5cf6",
	},
	fuchsia: {
		dot: "bg-fuchsia-500",
		bg: "bg-fuchsia-500",
		bgSoft: "bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border-fuchsia-500/30",
		border: "border-fuchsia-500/40",
		text: "text-fuchsia-700 dark:text-fuchsia-300",
		hex: "#d946ef",
	},
	rose: {
		dot: "bg-rose-500",
		bg: "bg-rose-500",
		bgSoft: "bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30",
		border: "border-rose-500/40",
		text: "text-rose-700 dark:text-rose-300",
		hex: "#f43f5e",
	},
	amber: {
		dot: "bg-amber-500",
		bg: "bg-amber-500",
		bgSoft: "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30",
		border: "border-amber-500/40",
		text: "text-amber-700 dark:text-amber-300",
		hex: "#f59e0b",
	},
	emerald: {
		dot: "bg-emerald-500",
		bg: "bg-emerald-500",
		bgSoft: "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30",
		border: "border-emerald-500/40",
		text: "text-emerald-700 dark:text-emerald-300",
		hex: "#10b981",
	},
	teal: {
		dot: "bg-teal-500",
		bg: "bg-teal-500",
		bgSoft: "bg-teal-500/15 hover:bg-teal-500/25 border-teal-500/30",
		border: "border-teal-500/40",
		text: "text-teal-700 dark:text-teal-300",
		hex: "#14b8a6",
	},
	slate: {
		dot: "bg-slate-500",
		bg: "bg-slate-500",
		bgSoft: "bg-slate-500/15 hover:bg-slate-500/25 border-slate-500/30",
		border: "border-slate-500/40",
		text: "text-slate-700 dark:text-slate-300",
		hex: "#64748b",
	},
};

export function isCalendarColor(value: unknown): value is CalendarColor {
	return typeof value === "string" && (CALENDAR_COLORS as readonly string[]).includes(value);
}

export function resolveColor(value: string | null | undefined): CalendarColor {
	return isCalendarColor(value) ? value : "sky";
}
