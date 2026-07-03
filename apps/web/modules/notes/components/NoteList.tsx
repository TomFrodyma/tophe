"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Spinner } from "@repo/ui/components/spinner";
import { toastError } from "@repo/ui/components/toast";
import { DragHandle, SortableGroup } from "@shared/components/sortable";
import { usePersistentState } from "@shared/hooks/use-persistent-state";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellIcon, PinIcon, PlusIcon, SearchIcon, StickyNoteIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

type KindFilter = "ALL" | "REMINDER" | "PLAIN";

const ALL = "ALL";
const REMINDER = "REMINDER";
const PLAIN = "PLAIN";

interface NoteLite {
	id: string;
	title: string;
	content: string;
	pinOrder: number | null;
	remindAt: Date | string | null;
	createdAt: Date | string;
}

function getPreview(content: string, max = 180) {
	const trimmed = content.trim().replace(/\s+/g, " ");
	if (!trimmed) return "";
	return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

export function NoteList() {
	const t = useTranslations("notes");
	const queryClient = useQueryClient();

	const [search, setSearch] = useState("");
	const [kind, setKind] = usePersistentState<KindFilter>("tophe.notes.kind", "ALL");

	const input = useMemo(
		() => ({
			search: search.trim() || undefined,
			withReminder: kind === "REMINDER" ? true : kind === "PLAIN" ? false : undefined,
		}),
		[search, kind],
	);

	const { data: notes, isLoading } = useQuery(orpc.notes.list.queryOptions({ input }));

	const pinMutation = useMutation(
		orpc.notes.update.mutationOptions({
			// Every filter variant of the list is affected by a pin flip.
			onSuccess: () =>
				void queryClient.invalidateQueries({ queryKey: orpc.notes.list.key() }),
			onError: () => toastError(t("list.saveError")),
		}),
	);

	const togglePin = (note: NoteLite) =>
		pinMutation.mutate({ id: note.id, pinned: note.pinOrder == null });

	const reorderMutation = useMutation(
		orpc.notes.reorder.mutationOptions({
			onError: () => {
				toastError(t("list.saveError"));
				void queryClient.invalidateQueries({ queryKey: orpc.notes.list.key() });
			},
		}),
	);

	// Optimistically reorder the pinned notes in the current list, then persist.
	// On failure the invalidate above snaps back to the server's order.
	const applyReorder = (ids: string[]) => {
		const pos = new Map(ids.map((id, i) => [id, i]));
		queryClient.setQueryData(orpc.notes.list.queryKey({ input }), (old) => {
			if (!old) return old;
			const moved = [...old]
				.filter((n) => pos.has(n.id))
				.sort((a, b) => pos.get(a.id)! - pos.get(b.id)!);
			let next = 0;
			return old.map((n) => (pos.has(n.id) ? moved[next++] : n));
		});
		reorderMutation.mutate({ ids });
	};

	const hasActiveFilters = search.trim().length > 0 || kind !== "ALL";

	function clearFilters() {
		setSearch("");
		setKind("ALL");
	}

	const now = Date.now();
	const pinned = (notes ?? []).filter((n) => n.pinOrder != null);
	const others = (notes ?? []).filter((n) => n.pinOrder == null);

	return (
		<div className="gap-4 flex flex-col">
			<Card className="gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end flex flex-col">
				<div className="gap-1.5 sm:min-w-[200px] sm:w-auto sm:flex-1 flex w-full flex-col">
					<label htmlFor="note-search" className="text-xs text-muted-foreground">
						{t("filters.search")}
					</label>
					<div className="relative">
						<SearchIcon className="left-3 size-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
						<Input
							id="note-search"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={t("filters.searchPlaceholder")}
							className="pl-9"
						/>
					</div>
				</div>
				<div className="gap-1.5 flex flex-col">
					<label className="text-xs text-muted-foreground">{t("filters.kind")}</label>
					<Select value={kind} onValueChange={(v) => setKind(v as KindFilter)}>
						<SelectTrigger className="sm:min-w-[180px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>{t("filters.kindAll")}</SelectItem>
							<SelectItem value={REMINDER}>{t("filters.kindReminder")}</SelectItem>
							<SelectItem value={PLAIN}>{t("filters.kindPlain")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				{hasActiveFilters && (
					<Button
						variant="ghost"
						size="sm"
						onClick={clearFilters}
						className="sm:self-auto self-start"
					>
						{t("filters.clear")}
					</Button>
				)}
			</Card>

			{isLoading ? (
				<div className="py-12 flex items-center justify-center">
					<Spinner className="size-5" />
				</div>
			) : !notes || notes.length === 0 ? (
				hasActiveFilters ? (
					<Card className="gap-2 py-10 flex flex-col items-center text-center">
						<p className="font-medium">{t("filters.emptyTitle")}</p>
						<p className="text-sm text-muted-foreground">{t("filters.emptyHint")}</p>
						<Button variant="ghost" size="sm" onClick={clearFilters} className="mt-1">
							{t("filters.clear")}
						</Button>
					</Card>
				) : (
					<Card className="gap-3 py-12 flex flex-col items-center justify-center text-center">
						<StickyNoteIcon className="size-8 text-muted-foreground" />
						<h3 className="font-medium text-lg">{t("empty.title")}</h3>
						<p className="max-w-md text-sm text-muted-foreground">
							{t("empty.description")}
						</p>
						<Button asChild className="mt-2">
							<Link href="/notes/new">
								<PlusIcon className="size-4" />
								{t("empty.cta")}
							</Link>
						</Button>
					</Card>
				)
			) : (
				<div className="gap-6 flex flex-col">
					{pinned.length > 0 && (
						<section className="gap-2 flex flex-col">
							<h2 className="gap-1.5 px-1 text-sm font-semibold flex items-center">
								<PinIcon className="size-3.5" />
								{t("list.pinned")}
							</h2>
							<SortableGroup ids={pinned.map((n) => n.id)} onReorder={applyReorder}>
								<ul className="gap-3 flex flex-col">
									{pinned.map((note) => (
										<NoteCard
											key={note.id}
											note={note}
											now={now}
											sortable
											onTogglePin={togglePin}
										/>
									))}
								</ul>
							</SortableGroup>
						</section>
					)}
					{others.length > 0 && (
						<section className="gap-2 flex flex-col">
							{pinned.length > 0 && (
								<h2 className="px-1 text-sm font-semibold text-muted-foreground">
									{t("list.others")}
								</h2>
							)}
							<ul className="gap-3 flex flex-col">
								{others.map((note) => (
									<NoteCard
										key={note.id}
										note={note}
										now={now}
										onTogglePin={togglePin}
									/>
								))}
							</ul>
						</section>
					)}
				</div>
			)}
		</div>
	);
}

function NoteCard({
	note,
	now,
	sortable = false,
	onTogglePin,
}: {
	note: NoteLite;
	now: number;
	sortable?: boolean;
	onTogglePin: (note: NoteLite) => void;
}) {
	const t = useTranslations("notes");
	const format = useFormatter();
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: note.id,
		disabled: !sortable,
	});
	const isPinned = note.pinOrder != null;
	const remindAt = note.remindAt ? new Date(note.remindAt) : null;
	const isPast = remindAt && remindAt.getTime() < now;

	return (
		<li
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={cn(isDragging && "relative z-10 opacity-80")}
		>
			<Card className="gap-3 p-5 flex flex-row items-start transition-colors hover:bg-accent/30">
				{sortable && (
					<DragHandle
						label={t("list.reorder")}
						className="mt-1 -ml-1"
						{...attributes}
						{...listeners}
					/>
				)}
				<Link
					href={`/notes/${note.id}`}
					className="min-w-0 gap-2 flex flex-1 flex-col rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
				>
					<div className="gap-3 flex items-start justify-between">
						<h3 className="font-semibold text-base">{note.title}</h3>
						{remindAt && (
							<span
								className={
									isPast
										? "px-2 py-0.5 text-xs gap-1 inline-flex items-center rounded-full bg-muted text-muted-foreground"
										: "px-2 py-0.5 text-xs gap-1 inline-flex items-center rounded-full bg-primary/10 text-primary"
								}
							>
								<BellIcon className="size-3" />
								{format.dateTime(remindAt, {
									dateStyle: "medium",
									timeStyle: "short",
								})}
							</span>
						)}
					</div>
					{note.content.trim() && (
						<p className="text-sm text-muted-foreground">{getPreview(note.content)}</p>
					)}
					<p className="text-xs text-muted-foreground/70">
						{format.dateTime(new Date(note.createdAt), {
							dateStyle: "medium",
							timeStyle: "short",
						})}
					</p>
				</Link>
				<Button
					variant="ghost"
					size="icon"
					aria-label={t(isPinned ? "list.unpin" : "list.pin")}
					aria-pressed={isPinned}
					onClick={() => onTogglePin(note)}
					className="-mt-2 -mr-2 shrink-0"
				>
					<PinIcon
						className={cn(
							"size-4",
							isPinned ? "fill-current" : "text-muted-foreground",
						)}
					/>
				</Button>
			</Card>
		</li>
	);
}
