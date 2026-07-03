"use client";

import { cn } from "@repo/ui";
import { isSameMonth, isToday } from "date-fns";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";

import { LockIcon } from "lucide-react";

import { COLOR_CLASSES, resolveColor } from "../lib/colors";
import { getMonthGridDays, overlapsDay } from "../lib/date-utils";
import { resolveIcon } from "../lib/icons";
import type { CalendarOccurrence } from "./types";

interface MonthViewProps {
	focused: Date;
	occurrences: CalendarOccurrence[];
	onSelectOccurrence: (o: CalendarOccurrence) => void;
	onSelectDay: (d: Date) => void;
}

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const MAX_VISIBLE_PER_DAY = 3;

export function MonthView({ focused, occurrences, onSelectOccurrence, onSelectDay }: MonthViewProps) {
	const t = useTranslations("calendar");
	const format = useFormatter();
	const days = useMemo(() => getMonthGridDays(focused), [focused]);

	const eventsByDay = useMemo(() => {
		const map = new Map<string, CalendarOccurrence[]>();
		for (const day of days) {
			const key = day.toDateString();
			const matched = occurrences.filter((o) =>
				overlapsDay(day, new Date(o.startAt), new Date(o.endAt)),
			);
			matched.sort((a, b) => {
				if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
				return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
			});
			map.set(key, matched);
		}
		return map;
	}, [days, occurrences]);

	return (
		<div className="rounded-xl border bg-card overflow-hidden">
			<div className="grid grid-cols-7 border-b bg-muted/30">
				{WEEKDAY_KEYS.map((key) => (
					<div
						key={key}
						className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide"
					>
						{t(`weekdays.${key}`)}
					</div>
				))}
			</div>
			<div className="grid grid-cols-7 grid-rows-6 divide-x divide-y">
				{days.map((day) => {
					const inMonth = isSameMonth(day, focused);
					const today = isToday(day);
					const key = day.toDateString();
					const dayEvents = eventsByDay.get(key) ?? [];
					const visible = dayEvents.slice(0, MAX_VISIBLE_PER_DAY);
					const overflow = dayEvents.length - visible.length;
					return (
						<button
							type="button"
							key={key}
							onClick={() => onSelectDay(day)}
							className={cn(
								"min-h-[96px] gap-1 p-1.5 text-left flex flex-col transition-colors hover:bg-accent/30 focus-visible:outline-hidden focus-visible:bg-accent/50",
								!inMonth && "bg-muted/20 text-muted-foreground",
							)}
						>
							<div className="flex items-center justify-between">
								<span
									className={cn(
										"size-6 text-xs font-medium flex items-center justify-center rounded-full",
										today && "bg-primary text-primary-foreground",
										!today && !inMonth && "text-muted-foreground/70",
									)}
								>
									{format.dateTime(day, { day: "numeric" })}
								</span>
							</div>
							<div className="min-h-0 gap-1 flex flex-1 flex-col">
								{visible.map((o) => {
									const color = resolveColor(o.color);
									const classes = COLOR_CLASSES[color];
									const Icon = resolveIcon(o.icon);
									return (
										<span
											key={o.id}
											onClick={(e) => {
												e.stopPropagation();
												onSelectOccurrence(o);
											}}
											role="button"
											tabIndex={0}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													e.stopPropagation();
													onSelectOccurrence(o);
												}
											}}
											className={cn(
												"min-w-0 gap-1.5 px-1.5 py-0.5 text-xs border rounded-md truncate flex items-center cursor-pointer transition-colors",
												classes.bgSoft,
												classes.text,
											)}
											title={o.title}
										>
											{o.source === "OUTLOOK_ICS" ? (
												<LockIcon className="size-3 shrink-0 opacity-70" />
											) : Icon ? (
												<Icon className="size-3 shrink-0" />
											) : (
												<span
													className={cn("size-1.5 shrink-0 rounded-full", classes.dot)}
												/>
											)}
											<span className="truncate">
												{!o.allDay && (
													<span className="mr-1 opacity-70">
														{format.dateTime(new Date(o.startAt), {
															hour: "numeric",
															minute: "numeric",
														})}
													</span>
												)}
												{o.title}
											</span>
										</span>
									);
								})}
								{overflow > 0 && (
									<span className="px-1.5 py-0.5 text-xs text-muted-foreground">
										{t("month.moreCount", { count: overflow })}
									</span>
								)}
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}
