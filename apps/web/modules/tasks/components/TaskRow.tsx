"use client";

import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { toastError } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, Trash2Icon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { isOverdue, type TaskLite } from "../lib/filters";

interface TaskRowProps {
	task: TaskLite;
}

function toDateInput(value: Date | string | null): string {
	if (!value) return "";
	const d = typeof value === "string" ? new Date(value) : value;
	if (Number.isNaN(d.getTime())) return "";
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function TaskRow({ task }: TaskRowProps) {
	const t = useTranslations("tasks");
	const format = useFormatter();
	const queryClient = useQueryClient();
	const [expanded, setExpanded] = useState(false);
	const [titleDraft, setTitleDraft] = useState(task.title);
	const [notesDraft, setNotesDraft] = useState(task.notes ?? "");
	const [dueDateDraft, setDueDateDraft] = useState(toDateInput(task.dueDate));

	const invalidate = async () => {
		await queryClient.invalidateQueries({
			queryKey: orpc.tasks.list.queryKey({ input: {} }),
		});
	};

	const updateMutation = useMutation(
		orpc.tasks.update.mutationOptions({
			onSuccess: invalidate,
			onError: () => toastError(t("notifications.saveError")),
		}),
	);

	const deleteMutation = useMutation(
		orpc.tasks.delete.mutationOptions({
			onSuccess: invalidate,
			onError: () => toastError(t("notifications.deleteError")),
		}),
	);

	const toggleDone = () => {
		updateMutation.mutate({
			id: task.id,
			status: task.status === "DONE" ? "OPEN" : "DONE",
		});
	};

	const saveEdits = () => {
		const trimmed = titleDraft.trim();
		if (!trimmed) {
			setTitleDraft(task.title);
			return;
		}
		updateMutation.mutate({
			id: task.id,
			title: trimmed,
			notes: notesDraft.trim() || null,
			dueDate: dueDateDraft ? new Date(dueDateDraft) : null,
		});
		setExpanded(false);
	};

	const isDone = task.status === "DONE";
	const overdue = !isDone && isOverdue(task.dueDate);

	return (
		<li className="rounded-lg border bg-card">
			<div className="gap-3 p-3 flex items-center">
				<button
					type="button"
					aria-label={t(isDone ? "row.markOpen" : "row.markDone")}
					aria-pressed={isDone}
					onClick={toggleDone}
					className={cn(
						"size-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
						isDone
							? "bg-primary border-primary text-primary-foreground"
							: "border-muted-foreground/40 hover:border-foreground",
					)}
				>
					{isDone && <CheckIcon className="size-3" />}
				</button>

				<button
					type="button"
					onClick={() => setExpanded((v) => !v)}
					className="min-w-0 flex-1 gap-0.5 flex flex-col text-left"
				>
					<span
						className={cn(
							"text-sm truncate",
							isDone && "text-muted-foreground line-through",
						)}
					>
						{task.title}
					</span>
					{task.dueDate && (
						<span
							className={cn(
								"text-xs",
								overdue ? "text-destructive" : "text-muted-foreground",
							)}
						>
							{format.dateTime(new Date(task.dueDate), { dateStyle: "medium" })}
						</span>
					)}
				</button>

				<Button
					variant="ghost"
					size="icon"
					className="shrink-0"
					onClick={() => deleteMutation.mutate({ id: task.id })}
					aria-label={t("row.delete")}
				>
					<Trash2Icon className="size-4" />
				</Button>
			</div>

			{expanded && (
				<div className="gap-3 border-t p-3 flex flex-col">
					<div className="gap-1.5 flex flex-col">
						<label className="text-xs text-muted-foreground">{t("row.title")}</label>
						<Input
							value={titleDraft}
							onChange={(e) => setTitleDraft(e.target.value)}
						/>
					</div>
					<div className="gap-1.5 flex flex-col">
						<label className="text-xs text-muted-foreground">{t("row.dueDate")}</label>
						<Input
							type="date"
							value={dueDateDraft}
							onChange={(e) => setDueDateDraft(e.target.value)}
						/>
					</div>
					<div className="gap-1.5 flex flex-col">
						<label className="text-xs text-muted-foreground">{t("row.notes")}</label>
						<textarea
							value={notesDraft}
							onChange={(e) => setNotesDraft(e.target.value)}
							rows={3}
							className="rounded-md border bg-background p-2 text-sm"
							placeholder={t("row.notesPlaceholder")}
						/>
					</div>
					<div className="gap-2 flex justify-end">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setTitleDraft(task.title);
								setNotesDraft(task.notes ?? "");
								setDueDateDraft(toDateInput(task.dueDate));
								setExpanded(false);
							}}
						>
							{t("row.cancel")}
						</Button>
						<Button size="sm" onClick={saveEdits} loading={updateMutation.isPending}>
							{t("row.save")}
						</Button>
					</div>
				</div>
			)}
		</li>
	);
}
