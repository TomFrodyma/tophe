"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@repo/ui/components/popover";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface GoalQuickCheckInProps {
	goalId: string;
	type: string;
	currentValue: number;
	targetValue: number | null;
}

export function GoalQuickCheckIn({
	goalId,
	type,
	currentValue,
	targetValue,
}: GoalQuickCheckInProps) {
	const t = useTranslations("goals");
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [customValue, setCustomValue] = useState("1");

	const checkInMutation = useMutation(
		orpc.goals.checkIn.mutationOptions({
			onSuccess: async (result) => {
				toastSuccess(
					result.completed ? t("notifications.completed") : t("notifications.checkedIn"),
				);
				await queryClient.invalidateQueries({
					queryKey: orpc.goals.list.queryKey({ input: {} }),
				});
				await queryClient.invalidateQueries({
					queryKey: orpc.goals.get.queryKey({ input: { id: goalId } }),
				});
				setOpen(false);
			},
			onError: () => {
				toastError(t("notifications.checkInError"));
			},
		}),
	);

	if (type === "BOOLEAN") {
		const done = currentValue >= 1;
		return (
			<Button
				size="sm"
				variant={done ? "ghost" : "secondary"}
				disabled={done || checkInMutation.isPending}
				onClick={() => checkInMutation.mutate({ goalId, value: 1 })}
			>
				<CheckIcon className="size-4" />
				{done ? t("card.doneLabel") : t("card.markDone")}
			</Button>
		);
	}

	if (type === "MILESTONE") {
		return null;
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button size="sm" variant="secondary">
					<PlusIcon className="size-4" />
					{t("card.logProgress")}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-64">
				<div className="gap-3 flex flex-col">
					<div>
						<p className="font-medium text-sm">{t("card.logProgress")}</p>
						<p className="text-muted-foreground text-xs">
							{t("card.logHint")}
						</p>
					</div>
					<div className="gap-2 flex flex-wrap">
						{[1, 5, 10].map((amount) => (
							<Button
								key={amount}
								size="sm"
								variant="secondary"
								disabled={checkInMutation.isPending}
								onClick={() => checkInMutation.mutate({ goalId, value: amount })}
							>
								+{amount}
							</Button>
						))}
					</div>
					<form
						className="gap-2 flex items-end"
						onSubmit={(e) => {
							e.preventDefault();
							const value = Number(customValue);
							if (!Number.isFinite(value) || value === 0) return;
							checkInMutation.mutate({ goalId, value });
						}}
					>
						<div className="gap-1 flex flex-col flex-1">
							<label className="text-xs text-muted-foreground">
								{t("card.customAmount")}
							</label>
							<Input
								type="number"
								step="any"
								value={customValue}
								onChange={(e) => setCustomValue(e.target.value)}
							/>
						</div>
						<Button
							type="submit"
							size="sm"
							loading={checkInMutation.isPending}
							disabled={checkInMutation.isPending}
						>
							{t("card.logAction")}
						</Button>
					</form>
					{targetValue != null && (
						<p className="text-muted-foreground text-xs">
							{t("card.remaining", {
								remaining: Math.max(0, targetValue - currentValue).toString(),
							})}
						</p>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
