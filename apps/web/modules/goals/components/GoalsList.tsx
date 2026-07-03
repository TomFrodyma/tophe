"use client";

import { COLOR_CLASSES, resolveColor } from "@calendar/lib/colors";
import { resolveIcon } from "@calendar/lib/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Progress } from "@repo/ui/components/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Spinner } from "@repo/ui/components/spinner";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { toastError } from "@repo/ui/components/toast";
import { DragHandle, SortableGroup } from "@shared/components/sortable";
import { usePersistentState } from "@shared/hooks/use-persistent-state";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClockIcon, PlusIcon, SearchIcon, TargetIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
	computeProgress,
	GOAL_HORIZONS,
	type GoalHorizonValue,
	type GoalStatusValue,
} from "../lib/constants";
import { GoalQuickCheckIn } from "./GoalQuickCheckIn";

type StatusTab = "ACTIVE" | "COMPLETED" | "ALL";
type HorizonTab = GoalHorizonValue | "ALL";

function resolveStatus(tab: StatusTab): GoalStatusValue | null {
	if (tab === "ACTIVE") return "ACTIVE";
	if (tab === "COMPLETED") return "COMPLETED";
	return null;
}

function resolveHorizon(tab: HorizonTab): GoalHorizonValue | null {
	if (tab === "ALL") return null;
	return tab;
}

interface GoalListItem {
	id: string;
	title: string;
	description: string | null;
	type: string;
	status: string;
	horizon: string;
	targetValue: number | null;
	currentValue: number;
	unit: string | null;
	dueDate: Date | string | null;
	color: string;
	icon: string | null;
	milestones: { done: boolean }[];
}

export function GoalsList() {
	const t = useTranslations("goals");

	const [horizonTab, setHorizonTab] = usePersistentState<HorizonTab>(
		"tophe.goals.horizon",
		"ALL",
	);
	const [statusTab, setStatusTab] = usePersistentState<StatusTab>("tophe.goals.status", "ALL");
	const [search, setSearch] = useState("");

	const input = useMemo(
		() => ({
			status: resolveStatus(statusTab) ?? undefined,
			horizon: resolveHorizon(horizonTab) ?? undefined,
			search: search.trim() || undefined,
		}),
		[horizonTab, statusTab, search],
	);

	const queryClient = useQueryClient();
	const { data: goals, isLoading } = useQuery(orpc.goals.list.queryOptions({ input }));

	const reorderMutation = useMutation(
		orpc.goals.reorder.mutationOptions({
			onError: () => {
				toastError(t("list.reorderError"));
				void queryClient.invalidateQueries({ queryKey: orpc.goals.list.key() });
			},
		}),
	);

	// Optimistically reorder the currently displayed list (keyed by the active
	// filters), then persist. On failure the invalidate above snaps back.
	const applyReorder = (ids: string[]) => {
		const pos = new Map(ids.map((id, i) => [id, i]));
		queryClient.setQueryData(orpc.goals.list.queryKey({ input }), (old) => {
			if (!old) return old;
			const moved = [...old]
				.filter((g) => pos.has(g.id))
				.sort((a, b) => pos.get(a.id)! - pos.get(b.id)!);
			let next = 0;
			return old.map((g) => (pos.has(g.id) ? moved[next++] : g));
		});
		reorderMutation.mutate({ ids });
	};

	return (
		<div className="gap-4 flex flex-col">
			<Card className="gap-3 p-4 flex flex-col">
				<div className="gap-2 sm:flex-row sm:items-center flex flex-col">
					<Tabs
						value={horizonTab}
						onValueChange={(v) => setHorizonTab(v as HorizonTab)}
						className="sm:flex-1"
					>
						<TabsList className="border-none">
							{GOAL_HORIZONS.map((h) => (
								<TabsTrigger key={h} value={h}>
									{t(`horizons.${h}.label`)}
								</TabsTrigger>
							))}
							<TabsTrigger value="ALL">{t("filters.all")}</TabsTrigger>
						</TabsList>
					</Tabs>
					<Select value={statusTab} onValueChange={(v) => setStatusTab(v as StatusTab)}>
						<SelectTrigger className="h-8 text-xs w-auto min-w-[120px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">{t("filters.all")}</SelectItem>
							<SelectItem value="ACTIVE">{t("filters.active")}</SelectItem>
							<SelectItem value="COMPLETED">{t("filters.completed")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="relative w-full">
					<SearchIcon className="left-3 size-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder={t("filters.searchPlaceholder")}
						className="pl-9"
					/>
				</div>
			</Card>

			{isLoading ? (
				<div className="py-12 flex items-center justify-center">
					<Spinner className="size-5" />
				</div>
			) : !goals || goals.length === 0 ? (
				<Card className="gap-3 py-12 flex flex-col items-center justify-center text-center">
					<TargetIcon className="size-8 text-muted-foreground" />
					<h3 className="font-medium text-lg">{t("empty.title")}</h3>
					<p className="max-w-md text-sm text-muted-foreground">
						{t("empty.description")}
					</p>
					<Button asChild className="mt-2">
						<Link href="/goals/new">
							<PlusIcon className="size-4" />
							{t("empty.cta")}
						</Link>
					</Button>
				</Card>
			) : horizonTab === "ALL" ? (
				<div className="gap-6 flex flex-col">
					{GOAL_HORIZONS.map((horizon) => {
						const horizonGoals = goals.filter(
							(g) => (g.horizon as GoalHorizonValue) === horizon,
						);
						if (horizonGoals.length === 0) return null;
						return (
							<section key={horizon} className="gap-3 flex flex-col">
								<div className="gap-1 flex flex-col">
									<h2 className="font-semibold text-base">
										{t(`horizons.${horizon}.label`)}
									</h2>
									<p className="text-xs text-muted-foreground">
										{t(`horizons.${horizon}.description`)}
									</p>
								</div>
								<SortableGroup
									ids={horizonGoals.map((g) => g.id)}
									onReorder={applyReorder}
								>
									<ul className="gap-3 flex flex-col">
										{horizonGoals.map((goal) => (
											<GoalRow key={goal.id} goal={goal} sortable />
										))}
									</ul>
								</SortableGroup>
							</section>
						);
					})}
				</div>
			) : (
				<SortableGroup ids={goals.map((g) => g.id)} onReorder={applyReorder}>
					<ul className="gap-3 flex flex-col">
						{goals.map((goal) => (
							<GoalRow key={goal.id} goal={goal} sortable />
						))}
					</ul>
				</SortableGroup>
			)}
		</div>
	);
}

function GoalRow({ goal, sortable = false }: { goal: GoalListItem; sortable?: boolean }) {
	const t = useTranslations("goals");
	const format = useFormatter();
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: goal.id,
		disabled: !sortable,
	});
	const color = resolveColor(goal.color);
	const colorClasses = COLOR_CLASSES[color];
	const IconComp = resolveIcon(goal.icon);
	const progress = computeProgress({
		type: goal.type,
		currentValue: goal.currentValue,
		targetValue: goal.targetValue,
		milestones: goal.milestones,
	});
	const dueLabel = goal.dueDate
		? format.dateTime(new Date(goal.dueDate), { dateStyle: "medium" })
		: null;
	const statusKey = `statuses.${goal.status}` as const;

	return (
		<li
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={cn(isDragging && "relative z-10 opacity-80")}
		>
			<Card
				className={cn("group gap-3 p-5 flex flex-col border-l-4", colorClasses.border)}
			>
				<div className="gap-3 flex items-start justify-between">
					{sortable && (
						<DragHandle
							label={t("list.reorder")}
							// Out of sight until you hover (or tab to) the card - the
							// space stays reserved so nothing shifts.
							className="mt-2.5 -ml-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
							{...attributes}
							{...listeners}
						/>
					)}
					<Link
						href={`/goals/${goal.id}`}
						className="min-w-0 gap-2 flex flex-1 items-start transition-opacity hover:opacity-80"
					>
						<div
							className={cn(
								"size-9 flex shrink-0 items-center justify-center rounded-lg",
								colorClasses.bgSoft,
								colorClasses.text,
							)}
						>
							{IconComp ? (
								<IconComp className="size-4" />
							) : (
								<TargetIcon className="size-4" />
							)}
						</div>
						<div className="min-w-0 flex-1">
							<div className="gap-2 flex flex-wrap items-center">
								<h3 className="font-semibold text-base truncate">{goal.title}</h3>
								<span
									className={cn(
										"px-2 py-0.5 text-xs rounded-full",
										goal.status === "ACTIVE"
											? "bg-primary/10 text-primary"
											: "bg-muted text-muted-foreground",
									)}
								>
									{t(statusKey)}
								</span>
							</div>
							{goal.description && (
								<p className="mt-0.5 text-sm line-clamp-1 text-muted-foreground">
									{goal.description}
								</p>
							)}
						</div>
					</Link>
					{goal.status === "ACTIVE" && (
						<GoalQuickCheckIn
							goalId={goal.id}
							type={goal.type}
							currentValue={goal.currentValue}
							targetValue={goal.targetValue}
						/>
					)}
				</div>

				<div className="gap-1.5 flex flex-col">
					<div className="gap-3 text-xs flex items-center justify-between">
						<span className="text-muted-foreground">
							{progress.label}
							{goal.unit && goal.type === "NUMERIC" ? ` ${goal.unit}` : ""}
						</span>
						<span className="text-muted-foreground">
							{Math.round(progress.ratio * 100)}%
						</span>
					</div>
					<Progress value={progress.ratio * 100} className="h-2" />
				</div>

				{dueLabel && (
					<div className="gap-1.5 text-xs flex items-center text-muted-foreground">
						<CalendarClockIcon className="size-3.5" />
						<span>{t("card.dueBy", { date: dueLabel })}</span>
					</div>
				)}
			</Card>
		</li>
	);
}
