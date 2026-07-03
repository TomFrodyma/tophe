"use client";

import { Card } from "@repo/ui/components/card";
import { Spinner } from "@repo/ui/components/spinner";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { usePersistentState } from "@shared/hooks/use-persistent-state";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { CheckSquareIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import {
	filterForTodayTab,
	filterForUpcomingTab,
	type TaskLite,
} from "../lib/filters";
import { QuickAdd } from "./QuickAdd";
import { TaskRow } from "./TaskRow";

type TabKey = "TODAY" | "UPCOMING" | "ALL";

export function TaskList() {
	const t = useTranslations("tasks");
	const [tab, setTab] = usePersistentState<TabKey>("tophe.tasks.tab", "TODAY");

	const { data, isLoading } = useQuery(
		orpc.tasks.list.queryOptions({ input: {} }),
	);

	const tasks = (data ?? []) as TaskLite[];

	const filtered = useMemo(() => {
		if (tab === "TODAY") return filterForTodayTab(tasks);
		if (tab === "UPCOMING") return filterForUpcomingTab(tasks);
		return tasks;
	}, [tab, tasks]);

	const counts = useMemo(() => {
		const today = filterForTodayTab(tasks).length;
		const upcoming = filterForUpcomingTab(tasks).length;
		return { today, upcoming, all: tasks.length };
	}, [tasks]);

	const defaultDue =
		tab === "TODAY" ? new Date() : null;

	return (
		<div className="gap-4 flex flex-col">
			<QuickAdd defaultDueDate={defaultDue} />

			<Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
				<TabsList>
					<TabsTrigger value="TODAY">
						{t("tabs.today")}
						<span className="ml-2 text-xs text-muted-foreground">
							{counts.today}
						</span>
					</TabsTrigger>
					<TabsTrigger value="UPCOMING">
						{t("tabs.upcoming")}
						<span className="ml-2 text-xs text-muted-foreground">
							{counts.upcoming}
						</span>
					</TabsTrigger>
					<TabsTrigger value="ALL">
						{t("tabs.all")}
						<span className="ml-2 text-xs text-muted-foreground">
							{counts.all}
						</span>
					</TabsTrigger>
				</TabsList>
			</Tabs>

			{isLoading ? (
				<div className="py-12 flex items-center justify-center">
					<Spinner className="size-5" />
				</div>
			) : filtered.length === 0 ? (
				<Card className="gap-2 py-12 flex flex-col items-center text-center">
					<CheckSquareIcon className="size-8 text-muted-foreground" />
					<p className="font-medium">
						{tab === "TODAY"
							? t("empty.todayTitle")
							: tab === "UPCOMING"
								? t("empty.upcomingTitle")
								: t("empty.allTitle")}
					</p>
					<p className="max-w-md text-muted-foreground text-sm">
						{t("empty.hint")}
					</p>
				</Card>
			) : (
				<ul className="gap-2 flex flex-col">
					{filtered.map((task) => (
						<TaskRow key={task.id} task={task} />
					))}
				</ul>
			)}
		</div>
	);
}
