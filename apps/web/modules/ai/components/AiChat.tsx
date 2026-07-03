"use client";

import { Button } from "@repo/ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@repo/ui/components/sheet";
import { toastError } from "@repo/ui/components/toast";
import { useConfirmationAlert } from "@shared/components/ConfirmationAlertProvider";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { HistoryIcon, SlidersHorizontalIcon, SquarePenIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { useChatModels } from "../lib/models";
import { AgentSettingsSheet } from "./AgentSettingsSheet";
import { ChatThread } from "./ChatThread";
import { ConversationList } from "./ConversationList";
import { useAgentName } from "../hooks/use-agent-name";

interface Thread {
	id: string;
	messages: UIMessage[];
}

export function AiChat() {
	const agentName = useAgentName();
	const queryClient = useQueryClient();
	const { confirm } = useConfirmationAlert();
	const [thread, setThread] = useState<Thread | null>(null);
	const [historyOpen, setHistoryOpen] = useState(false);
	const { models, selected: model, selectModel, isLoading: modelsLoading } = useChatModels();

	const conversationsQuery = useQuery(orpc.ai.conversations.list.queryOptions());
	const conversations = conversationsQuery.data ?? [];

	// Generate the first conversation id on the client only - doing it in a
	// useState initializer would mismatch between SSR and hydration.
	useEffect(() => {
		if (!thread) {
			setThread({ id: crypto.randomUUID(), messages: [] });
		}
	}, [thread]);

	const refreshList = () =>
		queryClient.invalidateQueries({ queryKey: orpc.ai.conversations.list.queryKey() });

	const newChat = () => {
		setThread({ id: crypto.randomUUID(), messages: [] });
		setHistoryOpen(false);
	};

	const selectConversation = async (id: string) => {
		setHistoryOpen(false);
		if (id === thread?.id) {
			return;
		}
		try {
			const conv = await queryClient.fetchQuery(
				orpc.ai.conversations.get.queryOptions({ input: { id } }),
			);
			setThread({ id: conv.id, messages: conv.messages as unknown as UIMessage[] });
		} catch {
			toastError("Couldn't open that conversation");
		}
	};

	const deleteMutation = useMutation(
		orpc.ai.conversations.delete.mutationOptions({
			onSuccess: () => refreshList(),
		}),
	);

	const deleteConversation = (id: string) => {
		confirm({
			title: "Delete conversation?",
			message: "This removes the thread and its messages.",
			destructive: true,
			confirmLabel: "Delete",
			onConfirm: async () => {
				await deleteMutation.mutateAsync({ id });
				if (id === thread?.id) {
					newChat();
				}
			},
		});
	};

	// Brief, until the id is generated client-side.
	if (!thread) {
		return null;
	}

	const list = (
		<ConversationList
			conversations={conversations}
			activeId={thread.id}
			onSelect={selectConversation}
			onNew={newChat}
			onDelete={deleteConversation}
			isLoading={conversationsQuery.isLoading}
		/>
	);

	return (
		<div className="mx-auto flex h-[calc(100vh-9rem)] w-full max-w-3xl flex-col">
			<div className="gap-2 pb-3 flex items-center justify-between border-b">
				<div className="flex min-w-0 items-center gap-2">
					<h1 className="truncate font-semibold text-lg">{agentName}</h1>
				</div>

				<div className="gap-1 flex shrink-0 items-center">
					<Button
						variant="ghost"
						size="icon"
						onClick={newChat}
						aria-label="New chat"
						title="New chat"
					>
						<SquarePenIcon className="size-5" />
					</Button>

					<Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								aria-label="Chat history"
								title="Chat history"
							>
								<HistoryIcon className="size-5" />
							</Button>
						</SheetTrigger>
						<SheetContent className="w-80">
							<SheetHeader>
								<SheetTitle>History</SheetTitle>
							</SheetHeader>
							<div className="mt-4 h-[calc(100%-3rem)]">{list}</div>
						</SheetContent>
					</Sheet>

					<div className="mx-1 h-5 w-px bg-border" />

					<Select value={model ?? ""} onValueChange={selectModel}>
						<SelectTrigger
							className="h-8 gap-1 text-sm w-auto shrink-0 whitespace-nowrap"
							aria-label="Model"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{models.map((m) => (
								<SelectItem key={m.id} value={m.id}>
									{m.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<AgentSettingsSheet>
						<Button
							variant="outline"
							size="sm"
							className="gap-2 shrink-0"
							aria-label="Customize"
							title="Customize"
						>
							<SlidersHorizontalIcon className="size-4" />
							<span className="hidden sm:inline">Customize</span>
						</Button>
					</AgentSettingsSheet>
				</div>
			</div>

			<div className="min-h-0 flex-1">
				{model ? (
					<ChatThread
						key={thread.id}
						conversationId={thread.id}
						initialMessages={thread.messages}
						model={model}
						onFinished={refreshList}
					/>
				) : modelsLoading ? null : (
					<div className="gap-3 py-16 flex flex-col items-center justify-center text-center">
						<p className="font-medium">No AI is configured yet.</p>
						<div className="max-w-md space-y-2 text-sm text-muted-foreground">
							<p>
								The assistant, briefing, and greeting stay off until the app
								has a model. Set any of these on the server and restart:
							</p>
							<ul className="space-y-1 text-left">
								<li>
									<code>ANTHROPIC_API_KEY</code> — Claude
								</li>
								<li>
									<code>OPENAI_API_KEY</code> — OpenAI, or any compatible
									provider (OpenRouter, Groq, Mistral, …) via{" "}
									<code>OPENAI_BASE_URL</code>
								</li>
								<li>
									<code>LOCAL_AI_BASE_URL</code> — a self-hosted server
									(Ollama, LM Studio, llama.cpp, vLLM); its models are picked
									up automatically
								</li>
							</ul>
							<p>
								Installed with the script? Re-run <code>./install.sh</code>.
								Deployed on Railway? Open the app service → Variables, add a
								key, and redeploy. Details are in the README.
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
