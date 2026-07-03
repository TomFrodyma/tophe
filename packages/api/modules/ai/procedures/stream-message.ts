import { ORPCError, streamToEventIterator } from "@orpc/client";
import {
	convertToModelMessages,
	findChatModel,
	generateId,
	getDefaultChatModelId,
	modelById,
	stepCountIs,
	streamText,
	type UIMessage,
	webSearchChatModel,
} from "@repo/ai";
import { getAgentProfileForUser, getUserById, saveAgentConversation } from "@repo/database";
import { logger } from "@repo/logs";
import z from "zod";

import { protectedProcedure } from "../../../orpc/procedures";
import { buildSystemPrompt } from "../lib/agent-prompt";
import { buildAgentTools } from "../lib/tools";

// Cap how many tool-call rounds the agent can take in one turn - a backstop
// against a runaway loop, not a normal limit.
const MAX_STEPS = 12;

function deriveTitle(messages: UIMessage[]): string | null {
	const firstUser = messages.find((m) => m.role === "user");
	if (!firstUser) return null;
	const text = firstUser.parts
		.filter((p): p is { type: "text"; text: string } => p.type === "text")
		.map((p) => p.text)
		.join(" ")
		.trim();
	if (!text) return null;
	return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

export const streamMessage = protectedProcedure
	.route({
		method: "POST",
		path: "/ai/stream",
		tags: ["AI"],
		summary: "Stream a turn from the personal agent",
		description:
			"Runs the tool-using agent over the conversation and streams the reply, persisting the thread.",
	})
	.input(
		z.object({
			// Client-generated id so the stream needn't return one to keep the thread.
			conversationId: z.string().min(1).max(64),
			// Validated against the model registry in the handler (the registry is
			// env-driven, so a static enum here would crash an unconfigured boot).
			model: z.string().max(100).optional(),
			messages: z.array(z.any() as z.ZodType<UIMessage>),
		}),
	)
	.handler(async ({ input, context: { user } }) => {
		const { conversationId, messages } = input;
		const modelId = input.model ?? (await getDefaultChatModelId());
		// Allowlist check: only models the deployment actually configured.
		const modelEntry = await findChatModel(modelId);
		if (!modelEntry) {
			throw new ORPCError("BAD_REQUEST", { message: "Unknown or unconfigured model" });
		}

		const [profile, dbUser] = await Promise.all([
			getAgentProfileForUser(user.id),
			getUserById(user.id),
		]);

		// Server-side web search where the provider supports it (Anthropic, or
		// OpenAI itself via the Responses API); null keeps the model webless.
		const webSearch = webSearchChatModel(modelEntry);

		const system = buildSystemPrompt({
			persona: profile?.personaPrompt,
			agentName: profile?.name,
			coreProfile: profile?.coreProfile,
			model: modelEntry,
			now: new Date(),
			timezone: dbUser?.timezone ?? "UTC",
			webSearch: webSearch !== null,
		});

		// Only user/assistant turns may come from the client. The system prompt is
		// assembled server-side; dropping any other role stops a forged "system"
		// turn from overriding the agent's boundaries or being persisted/replayed.
		const safeMessages = (messages as unknown as UIMessage[]).filter(
			(m) => m.role === "user" || m.role === "assistant",
		);

		// Prompt caching. The system prompt + tool schemas (stable) and the growing
		// conversation prefix (append-only) get re-sent on every tool-loop step AND
		// every turn; with no breakpoints each resend is billed at full input price,
		// which is what made a short chat cost ~$0.19. Two ephemeral breakpoints -
		// one on the system block (also covers the tools, which render before it)
		// and one on the last message (covers the pulled-context history) - drop
		// those repeated reads to ~0.1x.
		//
		// Privacy: cache_control is metadata only. It changes nothing about what
		// reaches Anthropic - the same content is sent on every request regardless.
		// The cache is scoped to our API key and keyed by an exact-prefix hash, so
		// it is not a new exposure path for the user's sensitive context.
		const cacheControl = { anthropic: { cacheControl: { type: "ephemeral" } } };
		const modelMessages = await convertToModelMessages(safeMessages);
		const lastMessage = modelMessages[modelMessages.length - 1];
		if (lastMessage) {
			lastMessage.providerOptions = cacheControl;
		}

		const result = streamText({
			model: webSearch ? webSearch.model : await modelById(modelId),
			tools: { ...buildAgentTools(user.id), ...webSearch?.tools },
			stopWhen: stepCountIs(MAX_STEPS),
			messages: [
				{ role: "system", content: system, providerOptions: cacheControl },
				...modelMessages,
			],
		});

		const stream = result.toUIMessageStream({
			originalMessages: safeMessages,
			// Forward web-search citations so the chat can render source links.
			sendSources: true,
			// Without this the assistant message gets an empty id; ids are globally
			// unique in the DB, so the first empty-id row blocked every later save.
			generateMessageId: generateId,
			onFinish: async ({ messages: finalMessages }) => {
				try {
					await saveAgentConversation({
						id: conversationId,
						userId: user.id,
						title: deriveTitle(finalMessages),
						messages: finalMessages.map((m) => ({
							id: m.id,
							role: m.role,
							parts: m.parts,
						})),
					});
				} catch (error) {
					// Persistence is best-effort; never break the chat over it.
					logger.error("Failed to persist agent conversation", error);
				}
			},
		});

		return streamToEventIterator(stream);
	});
