import { anthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel, ToolSet } from "ai";

// ---------------------------------------------------------------------------
// Model registry. The app never talks to a provider directly - every feature
// resolves its model here, so which providers exist is purely an env decision:
//
//   ANTHROPIC_API_KEY   enables the Claude models below (optional).
//   OPENAI_API_KEY      enables a hosted OpenAI-compatible provider (optional).
//   OPENAI_BASE_URL     where that provider lives. Default is OpenAI itself
//                       (https://api.openai.com/v1); point it at OpenRouter,
//                       Groq, Mistral, xAI, or anything else that speaks the
//                       same standard chat API.
//   OPENAI_MODELS       optional curated override of model auto-discovery:
//                       comma-separated "id" or "id=Label" pairs.
//   LOCAL_AI_BASE_URL   enables self-hosted models: Ollama (http://host:11434/v1),
//                       LM Studio, llama.cpp, vLLM, or anything else that speaks
//                       the same standard chat API (optional). Installed models
//                       are auto-discovered from the server's /models endpoint.
//   LOCAL_AI_MODELS     optional curated override, same format as OPENAI_MODELS,
//                       e.g. "llama3.3=Llama 3.3,qwen2.5:32b=Qwen 2.5 32B".
//   LOCAL_AI_API_KEY    bearer for the local server if it wants one (optional).
//   AI_DEFAULT_MODEL    id of the default chat model (optional).
//   AI_TASK_MODEL       id used for ALL background features - greeting,
//                       briefing, summaries, insights (optional; defaults to
//                       per-task Claude picks when Anthropic is enabled,
//                       otherwise the default model).
//
// At least one provider must be configured for the AI features to work; the
// rest of the app runs fine without any.
// ---------------------------------------------------------------------------

export interface ChatModel {
	id: string;
	label: string;
	provider: "anthropic" | "openai" | "local";
	/** Short description shown in the model selector. */
	hint: string;
}

const anthropicEnabled = !!process.env.ANTHROPIC_API_KEY;

const ANTHROPIC_MODELS: ChatModel[] = [
	{ id: "claude-opus-4-8", label: "Opus 4.8", provider: "anthropic", hint: "Most capable" },
	{ id: "claude-sonnet-4-6", label: "Sonnet 4.6", provider: "anthropic", hint: "Balanced" },
	{ id: "claude-haiku-4-5-20251001", label: "Haiku 4.5", provider: "anthropic", hint: "Fastest" },
];

// The hosted OpenAI-compatible provider and the self-hosted server share all
// machinery (client, curation, discovery); each is one "slot".
interface CompatSlot {
	provider: "openai" | "local";
	hint: string;
	baseUrl: string;
	/** Sent as a bearer when set to a real value ("none" placates local servers). */
	apiKey: string;
	curatedEnv: string | undefined;
	/** Drop non-chat ids from discovery (OpenAI's /models lists tts, embeddings, ...). */
	filterChat: boolean;
	client: ReturnType<typeof createOpenAICompatible>;
	discovered: { at: number; models: ChatModel[]; ok: boolean } | null;
}

const OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1";

function makeSlot(input: {
	provider: "openai" | "local";
	hint: string;
	baseUrl: string;
	apiKey: string;
	curatedEnv: string | undefined;
	filterChat?: boolean;
}): CompatSlot {
	return {
		...input,
		filterChat: input.filterChat ?? false,
		client: createOpenAICompatible({
			name: input.provider,
			baseURL: input.baseUrl,
			apiKey: input.apiKey,
		}),
		discovered: null,
	};
}

const openaiBaseUrl = process.env.OPENAI_BASE_URL?.trim() || OPENAI_DEFAULT_BASE_URL;

const hostedSlot: CompatSlot | null = process.env.OPENAI_API_KEY
	? makeSlot({
			provider: "openai",
			hint: "Hosted",
			baseUrl: openaiBaseUrl,
			apiKey: process.env.OPENAI_API_KEY,
			curatedEnv: process.env.OPENAI_MODELS,
			filterChat: new URL(openaiBaseUrl).hostname === "api.openai.com",
		})
	: null;

const localBaseUrl = process.env.LOCAL_AI_BASE_URL?.trim();

const localSlot: CompatSlot | null = localBaseUrl
	? makeSlot({
			provider: "local",
			hint: "Self-hosted",
			baseUrl: localBaseUrl,
			// Most local servers ignore auth; some (vLLM behind a proxy) want a key.
			apiKey: process.env.LOCAL_AI_API_KEY || "none",
			curatedEnv: process.env.LOCAL_AI_MODELS,
		})
	: null;

// A curated list, when set, replaces auto-discovery (useful for pretty labels
// or to hide models the server also hosts).
function parseCuratedModels(slot: CompatSlot): ChatModel[] {
	return (slot.curatedEnv ?? "")
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean)
		.map((entry) => {
			const [id, label] = entry.split("=").map((p) => p.trim());
			return { id, label: label || id, provider: slot.provider, hint: slot.hint };
		});
}

// OpenAI's /models endpoint lists everything the account can reach - audio,
// image, embedding, moderation models. Keep the chat-capable ones; the curated
// env var is the escape hatch when this filter is wrong.
const NON_CHAT_MODEL =
	/(audio|realtime|tts|whisper|embed|moderation|image|dall-e|davinci|babbage|transcribe|search)/;

// Discovery cache per slot: successes are fresh for a minute (a newly pulled
// model shows up on the next page load), failures for ten seconds (a down
// server isn't hammered, but recovery is quick).
async function slotModels(slot: CompatSlot | null): Promise<ChatModel[]> {
	if (!slot) {
		return [];
	}
	const curated = parseCuratedModels(slot);
	if (curated.length) {
		return curated;
	}

	const now = Date.now();
	if (slot.discovered && now - slot.discovered.at < (slot.discovered.ok ? 60_000 : 10_000)) {
		return slot.discovered.models;
	}

	try {
		const res = await fetch(`${slot.baseUrl.replace(/\/+$/, "")}/models`, {
			signal: AbortSignal.timeout(2_000),
			headers:
				slot.apiKey !== "none" ? { authorization: `Bearer ${slot.apiKey}` } : undefined,
		});
		if (!res.ok) {
			throw new Error(`${slot.provider} /models responded ${res.status}`);
		}
		const body = (await res.json()) as { data?: Array<{ id?: string }> };
		const models = (body.data ?? [])
			.map((m) => m.id)
			.filter((id): id is string => !!id)
			.filter((id) => !slot.filterChat || !NON_CHAT_MODEL.test(id))
			.map((id) => ({ id, label: id, provider: slot.provider, hint: slot.hint }));
		slot.discovered = { at: now, models, ok: true };
	} catch {
		// Server down or unreachable: offer no models rather than erroring.
		slot.discovered = { at: now, models: [], ok: false };
	}
	return slot.discovered.models;
}

/** Every model this deployment offers right now (all providers, merged). */
export async function getChatModels(): Promise<ChatModel[]> {
	const [hosted, local] = await Promise.all([slotModels(hostedSlot), slotModels(localSlot)]);
	return [...(anthropicEnabled ? ANTHROPIC_MODELS : []), ...hosted, ...local];
}

export async function findChatModel(id: string): Promise<ChatModel | undefined> {
	return (await getChatModels()).find((m) => m.id === id);
}

export async function getDefaultChatModelId(): Promise<string> {
	return (
		process.env.AI_DEFAULT_MODEL ??
		process.env.ANTHROPIC_CLAUDE_MODEL_ID ??
		(await getChatModels())[0]?.id ??
		""
	);
}

/**
 * Resolve an id to a callable model. Resolution is intentionally lenient (an
 * unknown id goes to the local, then hosted, provider if one exists) - the API
 * boundary validates ids against getChatModels() before calling this.
 */
export async function modelById(id: string) {
	if (anthropicEnabled && ANTHROPIC_MODELS.some((m) => m.id === id)) {
		return anthropic(id);
	}
	if (hostedSlot && (await slotModels(hostedSlot)).some((m) => m.id === id)) {
		return hostedSlot.client(id);
	}
	if (localSlot && (await slotModels(localSlot)).some((m) => m.id === id)) {
		return localSlot.client(id);
	}
	const fallback = localSlot ?? hostedSlot;
	if (fallback) {
		return fallback.client(id);
	}
	throw new Error(
		`No provider can serve AI model "${id}". Set ANTHROPIC_API_KEY, OPENAI_API_KEY, and/or LOCAL_AI_BASE_URL.`,
	);
}

// ---------------------------------------------------------------------------
// Web search - the interactive chat only. Both providers run the search
// server-side (no scraping from this process): Anthropic as a native tool,
// OpenAI through the Responses API. Other OpenAI-compatible hosts and local
// servers don't serve these tools, so their models stay webless. Background
// features (greeting, briefing, insights) deliberately never get web access.
// ---------------------------------------------------------------------------

// Searches are billed per use - cap what a single turn can burn.
const WEB_SEARCH_MAX_USES = 5;

// The Responses API only exists on OpenAI itself, not on compatible hosts
// (OpenRouter, Groq, ...) that the same slot may point at.
const openaiNative =
	hostedSlot && new URL(hostedSlot.baseUrl).hostname === "api.openai.com"
		? createOpenAI({ apiKey: hostedSlot.apiKey })
		: null;

/**
 * Web-search-capable model + tool for one chat turn, or null when the model's
 * provider can't search. When non-null, use this model instead of modelById():
 * OpenAI requests must go through the Responses API for the tool to work.
 */
export function webSearchChatModel(
	entry: ChatModel,
): { model: LanguageModel; tools: ToolSet } | null {
	if (entry.provider === "anthropic" && anthropicEnabled) {
		// Haiku only speaks the basic tool variant; Opus/Sonnet get the
		// newer one with server-side result filtering.
		const webSearch = entry.id.includes("haiku")
			? anthropic.tools.webSearch_20250305({ maxUses: WEB_SEARCH_MAX_USES })
			: anthropic.tools.webSearch_20260209({ maxUses: WEB_SEARCH_MAX_USES });
		return { model: anthropic(entry.id), tools: { web_search: webSearch } };
	}
	if (entry.provider === "openai" && openaiNative) {
		return {
			model: openaiNative(entry.id),
			// The tool's `{}` input doesn't satisfy ToolSet's index signature.
			tools: { web_search: openaiNative.tools.webSearch() } as ToolSet,
		};
	}
	return null;
}

/**
 * Model for background features (greeting, briefing, summaries, insights) where
 * the user doesn't pick. Each call site states its preferred Claude model; when
 * Anthropic isn't configured everything falls back to the default model, and
 * AI_TASK_MODEL overrides all of it.
 */
export async function taskModel(preferredAnthropicId: string) {
	const override = process.env.AI_TASK_MODEL;
	if (override) {
		return await modelById(override);
	}
	if (anthropicEnabled) {
		return anthropic(preferredAnthropicId);
	}
	return await modelById(await getDefaultChatModelId());
}

export * from "ai";
export * from "./lib";
