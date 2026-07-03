// The note should read as a sentence: no em/en dashes (turn them into a comma
// pause) and a capital first letter. The model is told this too, but doesn't
// always comply and its output is untrusted, so enforce it here.
export function polishNote(text: string): string {
	const cleaned = text
		.replace(/\s*[—–]\s*/g, ", ")
		.replace(/\s*,\s*,/g, ",")
		.trim();
	return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
