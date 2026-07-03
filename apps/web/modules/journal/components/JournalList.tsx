"use client";

import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Spinner } from "@repo/ui/components/spinner";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { NotebookPenIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

import { isJournalMood, JOURNAL_MOODS, type JournalMoodValue, MOOD_EMOJI } from "../lib/moods";

type RangeKey = "ALL" | "WEEK" | "MONTH" | "YEAR";
type MoodFilter = "ALL" | JournalMoodValue;
type DailyFilter = "ALL" | "DAILY" | "FREEFORM";

const ALL = "ALL";
const DAILY = "DAILY";
const FREEFORM = "FREEFORM";

function getFromDate(range: RangeKey): Date | undefined {
	if (range === "ALL") return undefined;
	const now = new Date();
	const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	if (range === "WEEK") from.setDate(from.getDate() - 7);
	else if (range === "MONTH") from.setMonth(from.getMonth() - 1);
	else from.setFullYear(from.getFullYear() - 1);
	return from;
}

function getPreview(content: string, max = 180) {
	const trimmed = content.trim().replace(/\s+/g, " ");
	if (!trimmed) return "";
	return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

export function JournalList() {
	const t = useTranslations("journal");
	const format = useFormatter();

	const [search, setSearch] = useState("");
	const [range, setRange] = useState<RangeKey>("ALL");
	const [mood, setMood] = useState<MoodFilter>("ALL");
	const [daily, setDaily] = useState<DailyFilter>("ALL");

	const input = useMemo(() => {
		const from = getFromDate(range);
		return {
			search: search.trim() || undefined,
			mood: mood === "ALL" ? undefined : mood,
			onlyDaily: daily === "DAILY" ? true : undefined,
			from,
		};
	}, [search, range, mood, daily]);

	const { data: entries, isLoading } = useQuery(orpc.journal.list.queryOptions({ input }));

	const filtered = useMemo(() => {
		if (!entries) return entries;
		if (daily === "FREEFORM") return entries.filter((e) => !e.isDaily);
		return entries;
	}, [entries, daily]);

	const hasActiveFilters =
		search.trim().length > 0 || range !== "ALL" || mood !== "ALL" || daily !== "ALL";

	function clearFilters() {
		setSearch("");
		setRange("ALL");
		setMood("ALL");
		setDaily("ALL");
	}

	return (
		<div className="gap-4 flex flex-col">
			<Card className="gap-3 p-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-end">
				<div className="gap-1.5 flex flex-col w-full sm:min-w-[200px] sm:w-auto sm:flex-1">
					<label htmlFor="journal-search" className="text-xs text-muted-foreground">
						{t("filters.search")}
					</label>
					<div className="relative">
						<SearchIcon className="top-1/2 left-3 absolute size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							id="journal-search"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={t("filters.searchPlaceholder")}
							className="pl-9"
						/>
					</div>
				</div>
				<div className="gap-2 grid grid-cols-3 sm:flex sm:gap-3">
					<div className="gap-1.5 flex flex-col">
						<label className="text-xs text-muted-foreground">{t("filters.range")}</label>
						<Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
							<SelectTrigger className="sm:min-w-[140px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL}>{t("filters.rangeAll")}</SelectItem>
								<SelectItem value="WEEK">{t("filters.rangeWeek")}</SelectItem>
								<SelectItem value="MONTH">{t("filters.rangeMonth")}</SelectItem>
								<SelectItem value="YEAR">{t("filters.rangeYear")}</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="gap-1.5 flex flex-col">
						<label className="text-xs text-muted-foreground">{t("filters.mood")}</label>
						<Select value={mood} onValueChange={(v) => setMood(v as MoodFilter)}>
							<SelectTrigger className="sm:min-w-[140px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL}>{t("filters.moodAll")}</SelectItem>
								{JOURNAL_MOODS.map((m) => (
									<SelectItem key={m} value={m}>
										<span className="mr-2">{MOOD_EMOJI[m]}</span>
										{t(`moods.${m}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="gap-1.5 flex flex-col">
						<label className="text-xs text-muted-foreground">{t("filters.kind")}</label>
						<Select value={daily} onValueChange={(v) => setDaily(v as DailyFilter)}>
							<SelectTrigger className="sm:min-w-[140px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL}>{t("filters.kindAll")}</SelectItem>
								<SelectItem value={DAILY}>{t("filters.kindDaily")}</SelectItem>
								<SelectItem value={FREEFORM}>{t("filters.kindFreeform")}</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				{hasActiveFilters && (
					<Button variant="ghost" size="sm" onClick={clearFilters} className="self-start sm:self-auto">
						{t("filters.clear")}
					</Button>
				)}
			</Card>

			{isLoading ? (
				<div className="py-12 flex items-center justify-center">
					<Spinner className="size-5" />
				</div>
			) : !filtered || filtered.length === 0 ? (
				hasActiveFilters ? (
					<Card className="gap-2 py-10 flex flex-col items-center text-center">
						<p className="font-medium">{t("filters.emptyTitle")}</p>
						<p className="text-muted-foreground text-sm">{t("filters.emptyHint")}</p>
						<Button variant="ghost" size="sm" onClick={clearFilters} className="mt-1">
							{t("filters.clear")}
						</Button>
					</Card>
				) : (
					<Card className="gap-3 py-12 flex flex-col items-center justify-center text-center">
						<NotebookPenIcon className="size-8 text-muted-foreground" />
						<h3 className="font-medium text-lg">{t("empty.title")}</h3>
						<p className="max-w-md text-muted-foreground text-sm">
							{t("empty.description")}
						</p>
						<Button asChild className="mt-2">
							<Link href="/journal/new">
								<PlusIcon className="size-4" />
								{t("empty.cta")}
							</Link>
						</Button>
					</Card>
				)
			) : (
				<ul className="gap-3 flex flex-col">
					{filtered.map((entry) => {
						const entryMood = isJournalMood(entry.mood) ? entry.mood : null;
						return (
							<li key={entry.id}>
								<Link
									href={`/journal/${entry.id}`}
									className="block rounded-xl transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
								>
									<Card className="gap-2 p-5 flex flex-col hover:bg-accent/30 transition-colors">
										<div className="gap-3 flex items-start justify-between">
											<div className="gap-2 flex flex-wrap items-center">
												<h3 className="font-semibold text-base">
													{entry.title}
												</h3>
												{entry.isDaily && (
													<span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
														{t("filters.kindDaily")}
													</span>
												)}
											</div>
											{entryMood && (
												<span
													className="text-xl"
													aria-label={t(`moods.${entryMood}`)}
													title={t(`moods.${entryMood}`)}
												>
													{MOOD_EMOJI[entryMood]}
												</span>
											)}
										</div>
										{entry.content.trim() && (
											<p className="text-sm text-muted-foreground">
												{getPreview(entry.content)}
											</p>
										)}
										<p className="text-xs text-muted-foreground/70">
											{format.dateTime(new Date(entry.createdAt), {
												dateStyle: "medium",
												timeStyle: "short",
											})}
										</p>
									</Card>
								</Link>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
