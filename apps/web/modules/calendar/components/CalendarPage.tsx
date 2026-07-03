"use client";

import { Button } from "@repo/ui/components/button";
import { Spinner } from "@repo/ui/components/spinner";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { orpcClient } from "@shared/lib/orpc-client";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	PlusIcon,
	RefreshCwIcon,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { useIsMobile } from "@shared/hooks/use-media-query";
import { usePersistentState } from "@shared/hooks/use-persistent-state";

import {
	type CalendarView,
	getAgendaRange,
	getDayRange,
	getMonthGridRange,
	getNextRange,
	getPrevRange,
} from "../lib/date-utils";
import { AgendaView } from "./AgendaView";
import { DayView } from "./DayView";
import { type EventDialogState, EventDialog } from "./EventDialog";
import { MonthView } from "./MonthView";
import { ViewSwitcher } from "./ViewSwitcher";

export function CalendarPage() {
	const t = useTranslations("calendar");
	const format = useFormatter();
	const isMobile = useIsMobile();
	// The last explicitly chosen view is the default next visit (per device).
	const [view, setView] = usePersistentState<CalendarView>("tophe.calendar.view", "MONTH");
	const [focused, setFocused] = useState<Date>(() => new Date());
	const [dialog, setDialog] = useState<EventDialogState | null>(null);

	// Force AGENDA view on mobile since MONTH doesn't render well at <768px.
	// Render-time only, so a mobile visit never overwrites the stored preference.
	const effectiveView: CalendarView = isMobile && view === "MONTH" ? "AGENDA" : view;

	const range = useMemo(() => {
		if (effectiveView === "MONTH") return getMonthGridRange(focused);
		if (effectiveView === "DAY") return getDayRange(focused);
		return getAgendaRange(focused);
	}, [effectiveView, focused]);

	const { data: occurrences, isLoading } = useQuery(
		orpc.calendar.list.queryOptions({
			input: { from: range.from, to: range.to },
		}),
	);

	const integrationQuery = useQuery(orpc.calendar.integrations.get.queryOptions());
	const queryClient = useQueryClient();
	const [isSyncing, setIsSyncing] = useState(false);

	async function handleSync() {
		if (isSyncing) return;
		setIsSyncing(true);
		try {
			const res = await orpcClient.calendar.integrations.sync({});
			toastSuccess(t("integrations.notifications.synced", { count: res.eventCount }));
			await queryClient.invalidateQueries({ queryKey: orpc.calendar.list.key() });
			await queryClient.invalidateQueries({
				queryKey: orpc.calendar.integrations.get.queryKey(),
			});
		} catch (err) {
			toastError(
				err instanceof Error ? err.message : t("integrations.notifications.syncError"),
			);
		} finally {
			setIsSyncing(false);
		}
	}

	const heading = useMemo(() => {
		if (effectiveView === "DAY") {
			return format.dateTime(focused, { dateStyle: "full" });
		}
		if (effectiveView === "AGENDA") {
			return t("agenda.heading");
		}
		return format.dateTime(focused, { year: "numeric", month: "long" });
	}, [focused, format, t, effectiveView]);

	return (
		<TooltipProvider delayDuration={150}>
			<div className="gap-6 flex flex-col">
				<div className="gap-3 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
					<div className="gap-3 flex flex-wrap items-center">
						<div className="rounded-lg border bg-card flex items-center">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="size-9 rounded-r-none"
										onClick={() => setFocused((d) => getPrevRange(effectiveView, d))}
										aria-label={t("nav.previous")}
									>
										<ChevronLeftIcon className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>{t("nav.previous")}</TooltipContent>
							</Tooltip>
							<Button
								variant="ghost"
								size="sm"
								className="h-9 rounded-none border-x px-3"
								onClick={() => setFocused(new Date())}
							>
								{t("nav.today")}
							</Button>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="size-9 rounded-l-none"
										onClick={() => setFocused((d) => getNextRange(effectiveView, d))}
										aria-label={t("nav.next")}
									>
										<ChevronRightIcon className="size-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>{t("nav.next")}</TooltipContent>
							</Tooltip>
						</div>
						<h2 className="font-semibold text-base sm:text-lg truncate">{heading}</h2>
					</div>
					<div className="gap-2 flex flex-wrap items-center">
						<ViewSwitcher value={effectiveView} onChange={setView} hideMonth={isMobile} />
						{integrationQuery.data && (
							<Button
								variant="secondary"
								size="sm"
								onClick={handleSync}
								loading={isSyncing}
								disabled={isSyncing}
							>
								<RefreshCwIcon className="size-4" />
								<span className="hidden sm:inline">{t("actions.syncOutlook")}</span>
							</Button>
						)}
						<Button
							size="sm"
							onClick={() => {
								const start = new Date(focused);
								start.setHours(9, 0, 0, 0);
								const end = new Date(start);
								end.setHours(10, 0, 0, 0);
								setDialog({ mode: "create", initial: { startAt: start, endAt: end } });
							}}
						>
							<PlusIcon className="size-4" />
							{t("actions.new")}
						</Button>
					</div>
				</div>

				{isLoading ? (
					<div className="py-16 flex items-center justify-center">
						<Spinner className="size-5" />
					</div>
				) : effectiveView === "MONTH" ? (
					<MonthView
						focused={focused}
						occurrences={occurrences ?? []}
						onSelectOccurrence={(o) =>
								setDialog({
									mode: "edit",
									eventId: o.eventId,
									occurrenceStart: new Date(o.occurrenceStart),
									isRecurring: o.isRecurring,
								})
							}
						onSelectDay={(day) => {
							const start = new Date(day);
							start.setHours(9, 0, 0, 0);
							const end = new Date(start);
							end.setHours(10, 0, 0, 0);
							setDialog({ mode: "create", initial: { startAt: start, endAt: end } });
							setFocused(day);
						}}
					/>
				) : effectiveView === "DAY" ? (
					<DayView
						day={focused}
						occurrences={occurrences ?? []}
						onSelectOccurrence={(o) =>
								setDialog({
									mode: "edit",
									eventId: o.eventId,
									occurrenceStart: new Date(o.occurrenceStart),
									isRecurring: o.isRecurring,
								})
							}
						onSelectSlot={(hour) => {
							const start = new Date(focused);
							start.setHours(hour, 0, 0, 0);
							const end = new Date(start);
							end.setHours(hour + 1, 0, 0, 0);
							setDialog({ mode: "create", initial: { startAt: start, endAt: end } });
						}}
					/>
				) : (
					<AgendaView
						occurrences={occurrences ?? []}
						onSelectOccurrence={(o) =>
								setDialog({
									mode: "edit",
									eventId: o.eventId,
									occurrenceStart: new Date(o.occurrenceStart),
									isRecurring: o.isRecurring,
								})
							}
					/>
				)}

				{dialog && (
					<EventDialog
						state={dialog}
						onClose={() => setDialog(null)}
						rangeInput={{ from: range.from, to: range.to }}
					/>
				)}
			</div>
		</TooltipProvider>
	);
}
