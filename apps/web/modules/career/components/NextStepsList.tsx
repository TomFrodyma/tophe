"use client";

import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { toastError } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, CircleIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function NextStepsList() {
	const t = useTranslations("career");
	const queryClient = useQueryClient();
	const { data: steps } = useQuery(orpc.career.nextSteps.list.queryOptions());
	const [text, setText] = useState("");

	const createMutation = useMutation(orpc.career.nextSteps.create.mutationOptions());
	const updateMutation = useMutation(orpc.career.nextSteps.update.mutationOptions());
	const deleteMutation = useMutation(orpc.career.nextSteps.delete.mutationOptions());

	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: orpc.career.nextSteps.list.queryKey(),
		});

	const onAdd = async () => {
		const trimmed = text.trim();
		if (!trimmed) {
			return;
		}
		try {
			await createMutation.mutateAsync({ text: trimmed });
			setText("");
			await invalidate();
		} catch {
			toastError(t("form.saveError"));
		}
	};

	const onToggle = async (id: string, done: boolean) => {
		try {
			await updateMutation.mutateAsync({ id, done: !done });
			await invalidate();
		} catch {
			toastError(t("form.saveError"));
		}
	};

	const onRemove = async (id: string) => {
		try {
			await deleteMutation.mutateAsync({ id });
			await invalidate();
		} catch {
			toastError(t("form.saveError"));
		}
	};

	return (
		<Card className="gap-3 p-5 flex flex-col">
			<div className="gap-1 flex flex-col">
				<h2 className="text-lg font-bold tracking-[-0.01em]">{t("nextSteps.title")}</h2>
				<p className="text-sm text-muted-foreground">{t("nextSteps.subtitle")}</p>
			</div>

			<div className="gap-2 flex">
				<Input
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							void onAdd();
						}
					}}
					placeholder={t("nextSteps.placeholder")}
				/>
				<Button onClick={onAdd} loading={createMutation.isPending}>
					<PlusIcon className="size-4" />
					{t("nextSteps.add")}
				</Button>
			</div>

			{steps && steps.length > 0 ? (
				<ul className="gap-1 flex flex-col">
					{steps.map((step) => (
						<li key={step.id} className="group gap-2 py-1.5 flex items-start">
							<button
								type="button"
								onClick={() => onToggle(step.id, step.done)}
								aria-label={t(
									step.done ? "nextSteps.markOpen" : "nextSteps.markDone",
								)}
								className={cn(
									"mt-0.5 size-5 flex shrink-0 items-center justify-center rounded-full border transition-colors",
									step.done
										? "text-white border-transparent bg-pop-primary"
										: "border-border text-transparent hover:border-foreground/40",
								)}
							>
								{step.done ? (
									<CheckIcon className="size-3.5" />
								) : (
									<CircleIcon className="size-2 opacity-0" />
								)}
							</button>
							<div className="min-w-0 flex flex-1 flex-col">
								<span
									className={cn(
										"text-sm leading-relaxed",
										step.done && "text-muted-foreground line-through",
									)}
								>
									{step.text}
								</span>
								{step.detail && (
									<span className="text-xs text-muted-foreground">
										{step.detail}
									</span>
								)}
							</div>
							{step.source === "AI" && (
								<span className="mt-0.5 font-semibold text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
									{t("nextSteps.aiTag")}
								</span>
							)}
							<button
								type="button"
								onClick={() => onRemove(step.id)}
								aria-label={t("nextSteps.remove")}
								className="mt-0.5 rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
							>
								<Trash2Icon className="size-3.5" />
							</button>
						</li>
					))}
				</ul>
			) : (
				<p className="text-sm text-muted-foreground">{t("nextSteps.empty")}</p>
			)}
		</Card>
	);
}
