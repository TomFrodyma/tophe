"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { toastError } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface QuickAddProps {
	defaultDueDate?: Date | null;
}

function toInputDate(value: Date | null): string {
	if (!value) return "";
	const y = value.getFullYear();
	const m = String(value.getMonth() + 1).padStart(2, "0");
	const day = String(value.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function QuickAdd({ defaultDueDate = null }: QuickAddProps) {
	const t = useTranslations("tasks");
	const queryClient = useQueryClient();
	const [title, setTitle] = useState("");
	const [dueDate, setDueDate] = useState<string>(toInputDate(defaultDueDate));
	const [showDate, setShowDate] = useState(false);

	const createMutation = useMutation(
		orpc.tasks.create.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: orpc.tasks.list.queryKey({ input: {} }),
				});
			},
			onError: () => toastError(t("notifications.saveError")),
		}),
	);

	const submit = () => {
		const trimmed = title.trim();
		if (!trimmed) return;
		createMutation.mutate({
			title: trimmed,
			dueDate: dueDate ? new Date(dueDate) : null,
		});
		setTitle("");
		setDueDate(toInputDate(defaultDueDate));
		setShowDate(false);
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				submit();
			}}
			className="gap-2 p-3 flex flex-wrap items-center rounded-lg border bg-card"
		>
			<PlusIcon className="size-4 text-muted-foreground shrink-0" />
			<Input
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				placeholder={t("quickAdd.placeholder")}
				className="min-w-[150px] flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
			/>
			{showDate ? (
				<div className="gap-1 flex items-center">
					<Input
						type="date"
						value={dueDate}
						onChange={(e) => setDueDate(e.target.value)}
						className="h-9 w-[150px]"
					/>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="shrink-0"
						onClick={() => {
							setShowDate(false);
							setDueDate("");
						}}
					>
						<XIcon className="size-4" />
					</Button>
				</div>
			) : (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => setShowDate(true)}
				>
					<CalendarIcon className="size-4" />
					{t("quickAdd.addDate")}
				</Button>
			)}
			<Button
				type="submit"
				size="sm"
				disabled={!title.trim() || createMutation.isPending}
				loading={createMutation.isPending}
			>
				{t("quickAdd.submit")}
			</Button>
		</form>
	);
}
