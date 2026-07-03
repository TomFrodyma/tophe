"use client";

import { useChat } from "@ai-sdk/react";
import { eventIteratorToStream } from "@orpc/client";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError } from "@repo/ui/components/toast";
import { orpcClient } from "@shared/lib/orpc-client";
import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { ArrowUpIcon, BrainIcon, EllipsisIcon, GlobeIcon, WrenchIcon } from "lucide-react";

import "streamdown/styles.css";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { useAgentName } from "../hooks/use-agent-name";
import { AgentIcon } from "./AgentIcon";

// Friendly labels for the read-only tools, so a tool call reads as "Looked at
// your calendar" rather than exposing the raw tool name.
const TOOL_LABELS: Record<string, string> = {
	getJournal: "your journal",
	getCalendar: "your calendar",
	getCareer: "your career",
	getGoals: "your goals",
	getTasks: "your tasks",
	getNotes: "your notes",
	getWishlist: "your wishlist",
	recallMemories: "its memory",
	saveMemory: "a new memory",
	web_search: "the web",
};

// A soft word-by-word blur-in on the streaming reply. Streamdown's animation
// bookkeeping is only reliable within a single markdown block (block
// boundaries shift mid-stream and re-reveal earlier text), so the streaming
// message is parsed as one block — see parseAsSingleBlock below.
const REVEAL_ANIMATION = {
	animation: "blurIn",
	duration: 300,
	easing: "ease-out",
	sep: "word",
	stagger: 20,
} as const;

const parseAsSingleBlock = (markdown: string) => [markdown];

// Chat replies never need remote images: a prompt-injected reply could use a
// markdown image to exfiltrate context to an attacker's server on render.
const CHAT_MARKDOWN_COMPONENTS = { img: () => null };

function isHttpUrl(url: string): boolean {
	try {
		return /^https?:$/.test(new URL(url).protocol);
	} catch {
		return false;
	}
}

// Assistant message body. Web-search citations arrive as source-url parts
// interleaved with text fragments, which rendered as a bubble-per-fragment
// mess; instead, text fragments merge into one bubble per run (chips still
// break runs) and all sources collect into a single row at the end.
function AssistantParts({ message, streaming }: { message: UIMessage; streaming: boolean }) {
	const parts = message.parts ?? [];
	const lastTextIndex = parts.reduce((acc, p, i) => (p.type === "text" ? i : acc), -1);

	const nodes: ReactNode[] = [];
	const sources: { url: string; title?: string }[] = [];
	const seenUrls = new Set<string>();
	let buffer = "";
	let bufferKey = 0;
	let bufferIsTail = false;

	const flushText = () => {
		if (buffer) {
			// Animate only the run that's actively streaming, so finished
			// messages and history never re-reveal.
			const isAnimating = streaming && bufferIsTail;
			nodes.push(
				<div
					key={`text-${bufferKey}`}
					className="prose prose-sm dark:prose-invert max-w-2xl px-4 py-2 rounded-lg bg-muted text-foreground **:max-w-full"
				>
					<Streamdown
						animated={isAnimating ? REVEAL_ANIMATION : false}
						isAnimating={isAnimating}
						parseMarkdownIntoBlocksFn={parseAsSingleBlock}
						components={CHAT_MARKDOWN_COMPONENTS}
						className="wrap-break-words"
					>
						{buffer}
					</Streamdown>
				</div>,
			);
		}
		buffer = "";
		bufferIsTail = false;
	};

	parts.forEach((part, i) => {
		if (part.type === "text") {
			if (!buffer) {
				bufferKey = i;
			}
			buffer += part.text;
			if (i === lastTextIndex) {
				bufferIsTail = true;
			}
			return;
		}
		if (part.type === "source-url") {
			if (isHttpUrl(part.url) && !seenUrls.has(part.url)) {
				seenUrls.add(part.url);
				sources.push({ url: part.url, title: part.title });
			}
			return;
		}
		if (part.type === "reasoning") {
			flushText();
			nodes.push(<ThinkingChip key={i} done={part.state !== "streaming"} />);
			return;
		}
		if (isToolUIPart(part)) {
			flushText();
			nodes.push(
				<ToolChip key={i} name={getToolName(part)} done={part.state === "output-available"} />,
			);
		}
	});
	flushText();

	return (
		<>
			{nodes}
			{sources.length > 0 && (
				<div className="gap-1.5 flex max-w-2xl flex-wrap">
					{sources.map((source) => (
						<a
							key={source.url}
							href={source.url}
							target="_blank"
							rel="noreferrer"
							title={source.title || source.url}
							className="gap-1.5 px-2.5 py-1 text-xs inline-flex max-w-56 items-center rounded-full border text-muted-foreground hover:text-foreground"
						>
							<GlobeIcon className="size-3 shrink-0" />
							<span className="truncate">{source.title || new URL(source.url).hostname}</span>
						</a>
					))}
				</div>
			)}
		</>
	);
}

// Reasoning models (Claude extended thinking, Qwen3-thinking, DeepSeek-R1, ...)
// emit hidden reasoning before the reply; without this chip the chat looks
// frozen for however long the model thinks.
function ThinkingChip({ done }: { done: boolean }) {
	return (
		<div className="gap-1.5 px-2.5 py-1 text-xs inline-flex items-center rounded-full bg-muted text-muted-foreground">
			<BrainIcon className={cn("size-3", !done && "animate-pulse")} />
			{done ? "Thought about it" : "Thinking…"}
		</div>
	);
}

function ToolChip({ name, done }: { name: string; done: boolean }) {
	const label = TOOL_LABELS[name] ?? name;
	const text =
		name === "saveMemory"
			? done
				? "Remembered something"
				: "Saving a memory…"
			: name === "web_search"
				? done
					? "Searched the web"
					: "Searching the web…"
				: done
					? `Looked at ${label}`
					: `Checking ${label}…`;
	return (
		<div className="gap-1.5 px-2.5 py-1 text-xs inline-flex items-center rounded-full bg-muted text-muted-foreground">
			<WrenchIcon className={cn("size-3", !done && "animate-pulse")} />
			{text}
		</div>
	);
}

export function ChatThread({
	conversationId,
	initialMessages,
	model,
	onFinished,
}: {
	conversationId: string;
	initialMessages: UIMessage[];
	model: string;
	onFinished: () => void;
}) {
	const [input, setInput] = useState("");
	const agentName = useAgentName();
	const containerRef = useRef<HTMLDivElement>(null);

	// Keep the latest model in a ref so the transport closure (built once by
	// useChat) always sends the current selection without remounting the thread.
	const modelRef = useRef(model);
	modelRef.current = model;

	const { messages, status, sendMessage } = useChat({
		id: conversationId,
		messages: initialMessages,
		onFinish: () => onFinished(),
		transport: {
			async sendMessages(options) {
				return eventIteratorToStream(
					await orpcClient.ai.stream(
						{ conversationId, model: modelRef.current, messages: options.messages },
						{ signal: options.abortSignal },
					),
				);
			},
			reconnectToStream() {
				throw new Error("Unsupported");
			},
		},
	});

	const busy = status === "streaming" || status === "submitted";
	const lastId = messages[messages.length - 1]?.id;

	const submit = async (text: string) => {
		const value = text.trim();
		if (!value || busy) {
			return;
		}
		setInput("");
		try {
			await sendMessage({ text: value });
		} catch {
			toastError("Failed to send message");
			setInput(value);
		}
	};

	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.scrollTop = containerRef.current.scrollHeight;
		}
	}, [messages, status]);

	return (
		<div className="flex h-full flex-col">
			<div ref={containerRef} className="gap-4 py-6 flex flex-1 flex-col overflow-y-auto">
				{messages.length === 0 && (
					<div className="gap-3 flex flex-1 flex-col items-center justify-center text-center">
						<AgentIcon className="size-14" title="" />
						<p className="font-medium text-lg text-foreground">What's on your mind?</p>
						<p className="max-w-sm text-sm text-muted-foreground">
							Ask about your week, your goals, what you journaled, or anything you'd
							think through with yourself.
						</p>
					</div>
				)}

				{messages.map((message) => {
					const isLast = message.id === lastId;
					return (
						<div
							key={message.id}
							className={cn(
								"gap-1.5 flex flex-col",
								message.role === "user" ? "items-end" : "items-start",
							)}
						>
							{message.role === "user" ? (
								message.parts?.map((part, i) =>
									part.type === "text" ? (
										<div
											key={i}
											className="max-w-2xl px-4 py-2 rounded-lg bg-primary/10 whitespace-pre-wrap text-foreground"
										>
											{part.text}
										</div>
									) : null,
								)
							) : (
								<AssistantParts
									message={message}
									streaming={status === "streaming" && isLast}
								/>
							)}
						</div>
					);
				})}

				{busy && messages[messages.length - 1]?.role !== "assistant" && (
					<div className="flex justify-start">
						<div className="px-4 py-2 rounded-lg bg-muted">
							<EllipsisIcon className="size-5 animate-pulse" />
						</div>
					</div>
				)}
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					void submit(input);
				}}
				className="text-lg relative shrink-0 rounded-2xl bg-card focus-within:ring focus-within:ring-primary focus-within:outline-none"
			>
				<Textarea
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={`Talk to ${agentName}…`}
					className="min-h-8 p-6 pr-14 rounded-2xl border bg-card shadow-none focus:outline-hidden focus-visible:ring-0"
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							void submit(input);
						}
					}}
				/>
				<Button
					type="submit"
					size="icon"
					variant="primary"
					className="right-3 bottom-3 absolute"
					disabled={!input.trim() || busy}
				>
					<ArrowUpIcon className="size-4" />
				</Button>
			</form>
		</div>
	);
}
