"use client";

import { cn } from "@repo/ui";
import { endOfDay, startOfDay } from "date-fns";
import { LockIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";

import { COLOR_CLASSES, resolveColor } from "../lib/colors";
import { resolveIcon } from "../lib/icons";
import type { CalendarOccurrence } from "./types";

interface DayViewProps {
	day: Date;
	occurrences: CalendarOccurrence[];
	onSelectOccurrence: (o: CalendarOccurrence) => void;
	onSelectSlot: (hour: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const PIXELS_PER_HOUR = 64;
const DEFAULT_SCROLL_HOUR = 6;
const SHORT_EVENT_THRESHOLD_PX = 40;

function formatHourLabel(h: number): string {
	if (h === 0) return "12 AM";
	if (h === 12) return "12 PM";
	return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

interface Placed {
	occ: CalendarOccurrence;
	top: number;
	height: number;
}

export function DayView({ day, occurrences, onSelectOccurrence, onSelectSlot }: DayViewProps) {
	const t = useTranslations("calendar");
	const format = useFormatter();
	const scrollRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = DEFAULT_SCROLL_HOUR * PIXELS_PER_HOUR;
		}
	}, []);

	const { allDay, placed } = useMemo(() => {
		const dayStart = startOfDay(day).getTime();
		const dayEnd = endOfDay(day).getTime();
		const allDay: CalendarOccurrence[] = [];
		const placed: Placed[] = [];
		for (const o of occurrences) {
			const start = new Date(o.startAt).getTime();
			const end = new Date(o.endAt).getTime();
			if (end <= dayStart || start >= dayEnd) continue;
			if (o.allDay || end - start >= 20 * 60 * 60 * 1000) {
				allDay.push(o);
				continue;
			}
			const effectiveStart = Math.max(start, dayStart);
			const effectiveEnd = Math.min(end, dayEnd);
			const top = ((effectiveStart - dayStart) / (60 * 60 * 1000)) * PIXELS_PER_HOUR;
			const height = Math.max(
				22,
				((effectiveEnd - effectiveStart) / (60 * 60 * 1000)) * PIXELS_PER_HOUR - 2,
			);
			placed.push({ occ: o, top, height });
		}
		placed.sort((a, b) => a.top - b.top);
		return { allDay, placed };
	}, [day, occurrences]);

	return (
		<div className="gap-4 flex flex-col">
			{allDay.length > 0 && (
				<div className="rounded-xl border bg-card p-3">
					<p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
						{t("day.allDay")}
					</p>
					<div className="gap-1.5 flex flex-col">
						{allDay.map((o) => {
							const color = resolveColor(o.color);
							const classes = COLOR_CLASSES[color];
							const Icon = resolveIcon(o.icon);
							return (
								<button
									key={o.id}
									type="button"
									onClick={() => onSelectOccurrence(o)}
									className={cn(
										"gap-2 px-2.5 py-1.5 text-sm text-left rounded-md border flex items-center transition-colors",
										classes.bgSoft,
										classes.text,
									)}
								>
									{o.source === "OUTLOOK_ICS" ? (
										<LockIcon className="size-4 shrink-0 opacity-70" />
									) : Icon ? (
										<Icon className="size-4 shrink-0" />
									) : (
										<span className={cn("size-2 shrink-0 rounded-full", classes.dot)} />
									)}
									<span className="truncate">{o.title}</span>
								</button>
							);
						})}
					</div>
				</div>
			)}

			<div
				ref={scrollRef}
				className="rounded-xl border bg-card overflow-x-hidden overflow-y-auto max-h-[min(70vh,640px)]"
			>
				<div className="relative flex">
					<div className="w-12 sm:w-16 shrink-0 border-r bg-muted/20">
						{HOURS.map((h) => (
							<div
								key={h}
								style={{ height: PIXELS_PER_HOUR }}
								className="pr-1.5 sm:pr-2 pt-1 text-[10px] sm:text-xs text-right text-muted-foreground"
							>
								{formatHourLabel(h)}
							</div>
						))}
					</div>
					<div className="relative flex-1">
						{HOURS.map((h) => (
							<button
								key={h}
								type="button"
								onClick={() => onSelectSlot(h)}
								style={{ height: PIXELS_PER_HOUR }}
								className="block w-full border-b border-dashed border-border/40 text-left transition-colors hover:bg-accent/30 focus-visible:outline-hidden focus-visible:bg-accent/50"
								aria-label={t("day.createAt", { time: formatHourLabel(h) })}
							/>
						))}
						{placed.map(({ occ, top, height }) => {
							const color = resolveColor(occ.color);
							const classes = COLOR_CLASSES[color];
							const Icon = resolveIcon(occ.icon);
							const isShort = height < SHORT_EVENT_THRESHOLD_PX;
							return (
								<button
									key={occ.id}
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										onSelectOccurrence(occ);
									}}
									style={{ top, height, left: "0.5rem", right: "0.5rem" }}
									className={cn(
										"absolute text-xs text-left border rounded-md flex flex-col overflow-hidden transition-colors",
										isShort ? "px-1.5 py-0.5 gap-0" : "px-2 py-1.5 gap-1",
										classes.bgSoft,
										classes.text,
									)}
								>
									<div className="gap-1.5 flex items-center leading-tight">
										{occ.source === "OUTLOOK_ICS" ? (
											<LockIcon className="size-3.5 shrink-0 opacity-70" />
										) : Icon ? (
											<Icon className="size-3.5 shrink-0" />
										) : (
											<span className={cn("size-2 shrink-0 rounded-full", classes.dot)} />
										)}
										<span className="font-medium truncate">{occ.title}</span>
									</div>
									{!isShort && (
										<span className="text-[10px] leading-tight opacity-75">
											{format.dateTime(new Date(occ.startAt), {
												hour: "numeric",
												minute: "numeric",
											})}
											{" – "}
											{format.dateTime(new Date(occ.endAt), {
												hour: "numeric",
												minute: "numeric",
											})}
										</span>
									)}
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
