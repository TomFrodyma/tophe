export const JOURNAL_MOODS = ["GREAT", "GOOD", "OKAY", "LOW", "BAD"] as const;

export type JournalMoodValue = (typeof JOURNAL_MOODS)[number];

export const MOOD_EMOJI: Record<JournalMoodValue, string> = {
	GREAT: "🤩",
	GOOD: "🙂",
	OKAY: "😐",
	LOW: "😕",
	BAD: "😣",
};

export function isJournalMood(value: unknown): value is JournalMoodValue {
	return typeof value === "string" && (JOURNAL_MOODS as readonly string[]).includes(value);
}
