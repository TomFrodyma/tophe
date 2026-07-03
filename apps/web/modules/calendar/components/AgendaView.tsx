"use client";

import { Card } from "@repo/ui/components/card";
import { cn } from "@repo/ui";
import { CalendarIcon, LockIcon, MapPinIcon, RepeatIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";

import { COLOR_CLASSES, resolveColor } from "../lib/colors";
import { isSameLocalDay } from "../lib/date-utils";
import { resolveIcon } from "../lib/icons";
import type { CalendarOccurrence } from "./types";

interface AgendaViewProps {
	occurrences: CalendarOccurrence[];
	onSelectOccurrence: (o: CalendarOccurrence) => void;
}

interface Group {
	day: Date;
	items: CalendarOccurrence[];
}

export function AgendaView({ occurrences, onSelectOccurrence }: AgendaViewProps) {
	const t = useTranslations("calendar");
	const format = useFormatter();

	const groups = useMemo<Group[]>(() => {
		const result: Group[] = [];
		for (const o of occurrences) {
			const start = new Date(o.startAt);
			const last = result[result.length - 1];
			if (last && isSameLocalDay(last.day, start)) {
				last.items.push(o);
			} else {
				result.push({ day: start, items: [o] });
			}
		}
		return result;
	}, [occurrences]);

	if (groups.length === 0) {
		return (
			<Card className="gap-3 py-12 flex flex-col items-center justify-center text-center">
				<CalendarIcon className="size-8 text-muted-foreground" />
				<h3 className="font-medium text-lg">{t("agenda.emptyTitle")}</h3>
				<p className="max-w-md text-muted-foreground text-sm">{t("agenda.emptyHint")}</p>
			</Card>
		);
	}

	return (
		<div className="gap-5 flex flex-col">
			{groups.map((group) => (
				<section key={group.day.toISOString()} className="gap-2 flex flex-col">
					<h3 className="px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
						{format.dateTime(group.day, {
							weekday: "long",
							month: "short",
							day: "numeric",
						})}
					</h3>
					<ul className="gap-2 flex flex-col">
						{group.items.map((o) => {
							const color = resolveColor(o.color);
							const classes = COLOR_CLASSES[color];
							const Icon = resolveIcon(o.icon);
							return (
								<li key={o.id}>
									<button
										type="button"
										onClick={() => onSelectOccurrence(o)}
										className="w-full text-left"
									>
										<Card className="gap-3 p-4 flex flex-row items-center hover:bg-accent/30 transition-colors">
											<div
												className={cn(
													"size-10 flex items-center justify-center rounded-lg border shrink-0",
													classes.bgSoft,
													classes.text,
												)}
											>
												{Icon ? (
													<Icon className="size-5" />
												) : (
													<span className={cn("size-2.5 rounded-full", classes.dot)} />
												)}
											</div>
											<div className="min-w-0 gap-0.5 flex flex-1 flex-col">
												<div className="gap-2 flex flex-wrap items-center">
													<h4 className="font-semibold text-sm">{o.title}</h4>
													{o.isRecurring && (
														<RepeatIcon
															className="size-3 text-muted-foreground"
															aria-label={t("agenda.recurring")}
														/>
													)}
													{o.source === "OUTLOOK_ICS" && (
														<span
															className="gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded border bg-slate-500/10 text-muted-foreground flex items-center"
															title={t("agenda.outlook")}
														>
															<LockIcon className="size-2.5" />
															{t("agenda.outlook")}
														</span>
													)}
												</div>
												<p className="text-xs text-muted-foreground">
													{o.allDay
														? t("agenda.allDay")
														: `${format.dateTime(new Date(o.startAt), {
																hour: "numeric",
																minute: "numeric",
															})} – ${format.dateTime(new Date(o.endAt), {
																hour: "numeric",
																minute: "numeric",
															})}`}
												</p>
												{o.location && (
													<p className="gap-1 mt-0.5 text-xs text-muted-foreground flex items-center">
														<MapPinIcon className="size-3" />
														{o.location}
													</p>
												)}
											</div>
										</Card>
									</button>
								</li>
							);
						})}
					</ul>
				</section>
			))}
		</div>
	);
}
