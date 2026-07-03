"use client";

import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { PlusIcon, Trash2Icon } from "lucide-react";

interface Conversation {
	id: string;
	title: string | null;
	updatedAt: string | Date;
}

export function ConversationList({
	conversations,
	activeId,
	onSelect,
	onNew,
	onDelete,
	isLoading,
}: {
	conversations: Conversation[];
	activeId: string;
	onSelect: (id: string) => void;
	onNew: () => void;
	onDelete: (id: string) => void;
	isLoading: boolean;
}) {
	return (
		<div className="gap-2 flex h-full flex-col">
			<Button onClick={onNew} variant="outline" className="gap-2 w-full justify-start">
				<PlusIcon className="size-4" />
				New chat
			</Button>

			<div className="-mr-1 pr-1 flex-1 overflow-y-auto">
				{isLoading ? (
					<p className="px-2 py-4 text-sm text-muted-foreground">Loading…</p>
				) : conversations.length === 0 ? (
					<p className="px-2 py-4 text-sm text-muted-foreground">No conversations yet.</p>
				) : (
					<ul className="gap-0.5 flex flex-col">
						{conversations.map((c) => (
							<li
								key={c.id}
								className={cn(
									"group gap-1 pr-1 flex items-center rounded-lg",
									c.id === activeId ? "bg-muted" : "hover:bg-muted/50",
								)}
							>
								<button
									type="button"
									onClick={() => onSelect(c.id)}
									className="min-w-0 px-2 py-2 text-sm flex-1 truncate text-left"
								>
									{c.title || "Untitled chat"}
								</button>
								<Button
									type="button"
									onClick={() => onDelete(c.id)}
									variant="ghost"
									size="icon"
									className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
									aria-label="Delete conversation"
								>
									<Trash2Icon className="size-3.5" />
								</Button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
