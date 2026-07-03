"use client";

import { COLOR_CLASSES, resolveColor } from "@calendar/lib/colors";
import { resolveIcon } from "@calendar/lib/icons";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Progress } from "@repo/ui/components/progress";
import { Spinner } from "@repo/ui/components/spinner";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useConfirmationAlert } from "@shared/components/ConfirmationAlertProvider";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArchiveIcon,
	CalendarClockIcon,
	CheckCircle2Icon,
	CheckIcon,
	PauseIcon,
	PencilIcon,
	PlayIcon,
	TargetIcon,
	Trash2Icon,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { computeProgress, type GoalStatusValue } from "../lib/constants";
import { GoalQuickCheckIn } from "./GoalQuickCheckIn";

interface GoalDetailProps {
	goalId: string;
}

export function GoalDetail({ goalId }: GoalDetailProps) {
	const t = useTranslations("goals");
	const format = useFormatter();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { confirm } = useConfirmationAlert();

	const { data: goal, isLoading } = useQuery(
		orpc.goals.get.queryOptions({ input: { id: goalId } }),
	);

	const updateMutation = useMutation(
		orpc.goals.update.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: orpc.goals.get.queryKey({ input: { id: goalId } }),
				});
				await queryClient.invalidateQueries({
					queryKey: orpc.goals.list.queryKey({ input: {} }),
				});
			},
		}),
	);

	const toggleMilestoneMutation = useMutation(
		orpc.goals.toggleMilestone.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: orpc.goals.get.queryKey({ input: { id: goalId } }),
				});
				await queryClient.invalidateQueries({
					queryKey: orpc.goals.list.queryKey({ input: {} }),
				});
			},
		}),
	);

	const deleteCheckInMutation = useMutation(
		orpc.goals.deleteCheckIn.mutationOptions({
			onSuccess: async () => {
				toastSuccess(t("notifications.checkInDeleted"));
				await queryClient.invalidateQueries({
					queryKey: orpc.goals.get.queryKey({ input: { id: goalId } }),
				});
				await queryClient.invalidateQueries({
					queryKey: orpc.goals.list.queryKey({ input: {} }),
				});
			},
			onError: () => toastError(t("notifications.deleteError")),
		}),
	);

	const deleteGoalMutation = useMutation(
		orpc.goals.delete.mutationOptions({
			onSuccess: async () => {
				toastSuccess(t("notifications.deleted"));
				await queryClient.invalidateQueries({
					queryKey: orpc.goals.list.queryKey({ input: {} }),
				});
				router.push("/goals");
			},
			onError: () => toastError(t("notifications.deleteError")),
		}),
	);

	if (isLoading || !goal) {
		return (
			<div className="py-12 flex items-center justify-center">
				<Spinner className="size-5" />
			</div>
		);
	}

	const color = resolveColor(goal.color);
	const colorClasses = COLOR_CLASSES[color];
	const IconComp = resolveIcon(goal.icon);
	const progress = computeProgress({
		type: goal.type,
		currentValue: goal.currentValue,
		targetValue: goal.targetValue,
		milestones: goal.milestones,
	});

	async function changeStatus(status: GoalStatusValue) {
		try {
			await updateMutation.mutateAsync({ id: goalId, status });
			toastSuccess(t("notifications.updated"));
		} catch (_error) {
			toastError(t("notifications.saveError"));
		}
	}

	return (
		<div className="gap-6 flex flex-col">
			<Card className={cn("gap-4 p-6 flex flex-col border-l-4", colorClasses.border)}>
				<div className="gap-4 flex flex-wrap items-start justify-between">
					<div className="gap-3 flex items-start">
						<div
							className={cn(
								"size-12 rounded-xl flex items-center justify-center",
								colorClasses.bgSoft,
								colorClasses.text,
							)}
						>
							{IconComp ? (
								<IconComp className="size-5" />
							) : (
								<TargetIcon className="size-5" />
							)}
						</div>
						<div>
							<div className="gap-2 flex flex-wrap items-center">
								<h1 className="font-semibold text-2xl">{goal.title}</h1>
								<span
									className={cn(
										"px-2 py-0.5 text-xs rounded-full",
										goal.status === "ACTIVE"
											? "bg-primary/10 text-primary"
											: "bg-muted text-muted-foreground",
									)}
								>
									{t(`statuses.${goal.status}` as const)}
								</span>
								<span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
									{t(`horizons.${goal.horizon}.label` as const)}
								</span>
							</div>
							<p className="mt-0.5 text-sm text-muted-foreground">
								{t(`types.${goal.type}.label` as const)}
							</p>
						</div>
					</div>
					<div className="gap-2 flex flex-wrap">
						{goal.status === "ACTIVE" && (
							<GoalQuickCheckIn
								goalId={goal.id}
								type={goal.type}
								currentValue={goal.currentValue}
								targetValue={goal.targetValue}
							/>
						)}
						<Button
							variant="secondary"
							size="sm"
							onClick={() => router.push(`/goals/${goalId}/edit`)}
						>
							<PencilIcon className="size-4" />
							{t("detail.edit")}
						</Button>
					</div>
				</div>

				{goal.description && (
					<p className="whitespace-pre-wrap text-sm text-muted-foreground">
						{goal.description}
					</p>
				)}

				<div className="gap-2 flex flex-col">
					<div className="gap-3 flex items-center justify-between text-sm">
						<span className="font-medium">
							{progress.label}
							{goal.unit && goal.type === "NUMERIC" ? ` ${goal.unit}` : ""}
						</span>
						<span className="text-muted-foreground">
							{Math.round(progress.ratio * 100)}%
						</span>
					</div>
					<Progress value={progress.ratio * 100} className="h-3" />
				</div>

				<div className="gap-4 flex flex-wrap text-xs text-muted-foreground">
					{goal.startDate && (
						<span className="gap-1 flex items-center">
							<CalendarClockIcon className="size-3.5" />
							{t("detail.startedOn", {
								date: format.dateTime(new Date(goal.startDate), {
									dateStyle: "medium",
								}),
							})}
						</span>
					)}
					{goal.dueDate && (
						<span className="gap-1 flex items-center">
							<CalendarClockIcon className="size-3.5" />
							{t("detail.dueOn", {
								date: format.dateTime(new Date(goal.dueDate), {
									dateStyle: "medium",
								}),
							})}
						</span>
					)}
					{goal.cadence !== "NONE" && (
						<span>
							{t("detail.cadenceLabel", {
								cadence: t(`cadences.${goal.cadence}` as const),
							})}
						</span>
					)}
				</div>

				<div className="mt-2 gap-2 flex flex-wrap border-t pt-4">
					{goal.status === "ACTIVE" && (
						<>
							<Button
								variant="secondary"
								size="sm"
								onClick={() => changeStatus("COMPLETED")}
							>
								<CheckCircle2Icon className="size-4" />
								{t("detail.markComplete")}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => changeStatus("PAUSED")}
							>
								<PauseIcon className="size-4" />
								{t("detail.pause")}
							</Button>
						</>
					)}
					{goal.status === "PAUSED" && (
						<Button
							variant="secondary"
							size="sm"
							onClick={() => changeStatus("ACTIVE")}
						>
							<PlayIcon className="size-4" />
							{t("detail.resume")}
						</Button>
					)}
					{goal.status === "COMPLETED" && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => changeStatus("ACTIVE")}
						>
							<PlayIcon className="size-4" />
							{t("detail.reopen")}
						</Button>
					)}
					{goal.status !== "ARCHIVED" && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => changeStatus("ARCHIVED")}
						>
							<ArchiveIcon className="size-4" />
							{t("detail.archive")}
						</Button>
					)}
					<Button
						variant="ghost"
						size="sm"
						className="text-destructive hover:text-destructive"
						onClick={() =>
							confirm({
								title: t("detail.deleteConfirm.title"),
								message: t("detail.deleteConfirm.message"),
								destructive: true,
								confirmLabel: t("detail.deleteConfirm.confirm"),
								onConfirm: async () => {
									await deleteGoalMutation.mutateAsync({ id: goalId });
								},
							})
						}
					>
						<Trash2Icon className="size-4" />
						{t("detail.delete")}
					</Button>
				</div>
			</Card>

			{goal.type === "MILESTONE" && goal.milestones.length > 0 && (
				<Card className="gap-3 p-6 flex flex-col">
					<h2 className="font-semibold text-lg">{t("detail.milestones")}</h2>
					<ul className="gap-2 flex flex-col">
						{goal.milestones.map((m) => (
							<li
								key={m.id}
								className="gap-3 flex items-center rounded-md py-1.5 px-2 hover:bg-muted/50"
							>
								<button
									type="button"
									aria-label={m.title}
									aria-pressed={m.done}
									onClick={() =>
										toggleMilestoneMutation.mutate({
											id: m.id,
											done: !m.done,
										})
									}
									className={cn(
										"size-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
										m.done
											? "bg-primary border-primary text-primary-foreground"
											: "border-muted-foreground/40 hover:border-foreground",
									)}
								>
									{m.done && <CheckIcon className="size-3" />}
								</button>
								<span
									className={cn(
										"flex-1 text-sm",
										m.done && "text-muted-foreground line-through",
									)}
								>
									{m.title}
								</span>
								{m.doneAt && (
									<span className="text-muted-foreground text-xs">
										{format.dateTime(new Date(m.doneAt), { dateStyle: "medium" })}
									</span>
								)}
							</li>
						))}
					</ul>
				</Card>
			)}

			{goal.checkIns.length > 0 && (
				<Card className="gap-3 p-6 flex flex-col">
					<h2 className="font-semibold text-lg">{t("detail.history")}</h2>
					<ul className="gap-2 flex flex-col">
						{goal.checkIns.map((c) => (
							<li
								key={c.id}
								className="gap-3 flex items-center rounded-md py-2 px-3 bg-muted/30"
							>
								<div className="flex-1">
									<p className="text-sm">
										<span className="font-medium">
											{goal.type === "NUMERIC" ? `+${c.value}` : t("detail.checkedIn")}
										</span>
										{c.note && (
											<span className="ml-2 text-muted-foreground">{c.note}</span>
										)}
									</p>
									<p className="text-muted-foreground text-xs">
										{format.dateTime(new Date(c.createdAt), {
											dateStyle: "medium",
											timeStyle: "short",
										})}
									</p>
								</div>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => deleteCheckInMutation.mutate({ id: c.id })}
								>
									<Trash2Icon className="size-4" />
								</Button>
							</li>
						))}
					</ul>
				</Card>
			)}

			<div>
				<Button asChild variant="ghost" size="sm">
					<Link href="/goals">{t("detail.back")}</Link>
				</Button>
			</div>
		</div>
	);
}
