import { streamText, taskModel } from "@repo/ai";
import { getJournalEntriesInRange } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

const periodSchema = z.enum(["WEEK", "MONTH", "YEAR"]);

// Bound how much journal history reaches the model per summary so a long range
// (e.g. a full year) can't balloon the request and the bill. Only the most
// recent entries are sent, and each entry's body is truncated.
const MAX_ENTRIES = 60;
const MAX_ENTRY_CHARS = 2000;

function getRange(period: z.infer<typeof periodSchema>, now = new Date()) {
	const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
	const from = new Date(to);
	if (period === "WEEK") from.setDate(from.getDate() - 7);
	else if (period === "MONTH") from.setMonth(from.getMonth() - 1);
	else from.setFullYear(from.getFullYear() - 1);
	return { from, to };
}

function formatEntries(
	entries: {
		title: string;
		content: string;
		mood: string | null;
		createdAt: Date;
	}[],
) {
	return entries
		.map((e) => {
			const date = e.createdAt.toISOString().slice(0, 10);
			const mood = e.mood ? ` [mood: ${e.mood}]` : "";
			const content = e.content.trim();
			const body =
				content.length > MAX_ENTRY_CHARS
					? `${content.slice(0, MAX_ENTRY_CHARS)}…`
					: content;
			return `### ${date}${mood} - ${e.title}\n${body}`;
		})
		.join("\n\n---\n\n");
}

// The summary streams back as an event iterator: one `meta` event first (the
// entry count the panel shows above the text), then a `delta` event per chunk
// of the model's reply, appended live on the client.
export const summarize = protectedProcedure
	.route({
		method: "POST",
		path: "/journal/summarize",
		tags: ["Journal"],
		summary: "Stream an AI summary of journal entries over a period",
	})
	.input(z.object({ period: periodSchema }))
	.handler(async function* ({ input: { period }, context: { user } }) {
		const { from, to } = getRange(period);
		const entries = await getJournalEntriesInRange(user.id, from, to);

		if (entries.length === 0) {
			throw new ORPCError("NOT_FOUND", {
				message: "No journal entries in this period yet.",
			});
		}

		const periodLabel =
			period === "WEEK" ? "past week" : period === "MONTH" ? "past month" : "past year";

		// Keep only the most recent entries (query returns oldest first).
		const sent = entries.slice(-MAX_ENTRIES);

		yield { type: "meta" as const, entryCount: sent.length };

		const result = streamText({
			model: await taskModel(process.env.ANTHROPIC_CLAUDE_MODEL_ID ?? "claude-opus-4-8"),
			// Generous ceiling so Opus 4.8's full reflection is never truncated
			// mid-sentence. Input is bounded above (MAX_ENTRIES/MAX_ENTRY_CHARS),
			// not here; streaming means the HTTP-timeout concern doesn't apply.
			maxOutputTokens: 8000,
			system:
				"You are a thoughtful journaling companion. You read the user's private journal " +
				"entries and produce a reflective, compassionate summary. Be concise, honest, and " +
				"specific. Use markdown with clear sections. Do not invent details that aren't " +
				"present. Write in the second person ('you').",
			prompt:
				`Summarize my journal entries from the ${periodLabel}. ` +
				`Highlight recurring themes, emotional patterns, notable events, and gentle ` +
				`observations or questions I might reflect on.\n\n` +
				`Use these sections:\n` +
				`## Overview\n## Themes\n## Mood & energy\n## Moments that stood out\n## Gentle reflections\n\n` +
				`Entries (${sent.length}):\n\n${formatEntries(sent)}`,
		});

		for await (const delta of result.textStream) {
			yield { type: "delta" as const, text: delta };
		}
	});
