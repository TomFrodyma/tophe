"use client";

import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { toastError } from "@repo/ui/components/toast";
import { BriefingSettingsSheet } from "@shared/components/BriefingSettingsSheet";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowUpRightIcon,
	ClockIcon,
	RefreshCwIcon,
	SlidersHorizontalIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

interface BriefingNewsItem {
	source: string;
	category: string;
	title: string;
	url: string;
	image: string | null;
	why: string;
}
interface BriefingOnThisDay {
	kind: "journal" | "note";
	when: string;
	title: string;
	excerpt: string;
	href: string;
}
interface BriefingPayload {
	masthead: {
		weekday: string;
		date: string;
		weatherPhrase: string | null;
		tempC: number | null;
		weatherLocation: string | null;
	};
	lead: string;
	day: { summary: string; agenda: string[] };
	news: BriefingNewsItem[];
	onThisDay: BriefingOnThisDay | null;
}

const EYEBROW = "text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-brand-ink/55";

export function BriefingPaper() {
	const t = useTranslations("briefing");

	const queryClient = useQueryClient();
	const { data, isLoading, isError } = useQuery({
		...orpc.ai.briefing.queryOptions(),
		// One paper per day: don't refetch on focus, and treat it as fresh for hours.
		staleTime: 6 * 60 * 60 * 1000,
		refetchOnWindowFocus: false,
	});

	const regenerate = useMutation(
		orpc.ai.briefingRegenerate.mutationOptions({
			onSuccess: (fresh) => queryClient.setQueryData(orpc.ai.briefing.queryKey(), fresh),
			onError: () => toastError(t("error")),
		}),
	);

	const [hero, ...rest] = data?.news ?? [];

	return (
		<div className="max-w-3xl gap-8 mx-auto flex w-full flex-col">
			<Masthead
				t={t}
				data={data}
				loading={isLoading}
				regenerating={regenerate.isPending}
				onRegenerate={() => regenerate.mutate({})}
			/>

			{isError ? (
				<p className="p-8 text-lg rounded-block bg-paper-sunk/50 text-center font-serif text-brand-ink/70">
					{t("error")}
				</p>
			) : isLoading || regenerate.isPending || !data ? (
				<ComposingState t={t} />
			) : (
				<>
					<LeadStory t={t} data={data} />

					<section className="gap-8 flex flex-col">
						<SectionRule>{t("theFeed")}</SectionRule>
						{data.news.length === 0 ? (
							<p className="font-serif text-brand-ink/60">{t("noNews")}</p>
						) : (
							<div className="gap-10 flex flex-col">
								{hero && <HeroStory t={t} item={hero} />}
								{rest.length > 0 && (
									<div className="gap-x-8 gap-y-10 sm:grid-cols-2 grid grid-cols-1">
										{rest.map((item) => (
											<NewsCard key={item.url} t={t} item={item} />
										))}
									</div>
								)}
							</div>
						)}
					</section>

					<OnThisDay t={t} item={data.onThisDay} />
				</>
			)}
		</div>
	);
}

// Hides itself if the feed image 404s or is blocked, so a broken image never
// leaves an empty box. External feed urls are scheme-checked server-side.
function NewsImage({ src, className }: { src: string | null; className: string }) {
	const [ok, setOk] = useState(true);
	if (!src || !ok) return null;
	return (
		<img
			src={src}
			alt=""
			loading="lazy"
			referrerPolicy="no-referrer"
			onError={() => setOk(false)}
			className={className}
		/>
	);
}

function ReadButton({ url, label }: { url: string; label: string }) {
	return (
		<Button asChild variant="outline" size="sm" className="w-fit">
			<a href={url} target="_blank" rel="noopener noreferrer">
				{label}
				<ArrowUpRightIcon className="size-4" />
			</a>
		</Button>
	);
}

function Masthead({
	t,
	data,
	loading,
	regenerating,
	onRegenerate,
}: {
	t: ReturnType<typeof useTranslations>;
	data?: BriefingPayload;
	loading: boolean;
	regenerating: boolean;
	onRegenerate: () => void;
}) {
	const m = data?.masthead;
	const dateline = m ? `${m.weekday}, ${m.date}` : loading ? t("composing") : "";
	const weather = m?.weatherPhrase
		? `${m.weatherPhrase}${m.tempC !== null ? `, ${m.tempC}°` : ""}`
		: null;

	return (
		<header className="gap-3 py-5 relative flex flex-col border-y-2 border-brand-ink/80 text-center">
			<div className="right-0 absolute top-1/2 flex -translate-y-1/2 flex-col sm:flex-row">
				<Button
					variant="ghost"
					size="icon"
					aria-label={t("regenerate")}
					onClick={onRegenerate}
					disabled={regenerating || loading}
				>
					<RefreshCwIcon
						className={cn("size-4 opacity-60", regenerating && "animate-spin")}
					/>
				</Button>
				<BriefingSettingsSheet>
					<Button variant="ghost" size="icon" aria-label={t("settings.title")}>
						<SlidersHorizontalIcon className="size-4 opacity-60" />
					</Button>
				</BriefingSettingsSheet>
			</div>
			<p className={EYEBROW}>{t("edition")}</p>
			<h1 className="text-5xl font-black md:text-7xl font-news leading-none tracking-[-0.02em]">
				{t("paperName")}
			</h1>
			<div className="gap-x-3 gap-y-1 text-sm flex flex-wrap items-center justify-center text-brand-ink/65">
				<span className="font-medium">{dateline}</span>
				{m?.weatherLocation && (
					<>
						<span aria-hidden>·</span>
						<span>{m.weatherLocation}</span>
					</>
				)}
				{weather && (
					<>
						<span aria-hidden>·</span>
						<span className="capitalize">{weather}</span>
					</>
				)}
			</div>
		</header>
	);
}

// Splits the day summary into two blocks at a sentence boundary, so each column
// reads as its own paragraph instead of one sentence spilling across the gap.
function splitIntoColumns(text: string): string[] {
	const sentences = text.match(/[^.!?]+(?:[.!?]+|$)/g);
	if (!sentences || sentences.length < 2) {
		return [text.trim()];
	}
	const mid = Math.ceil(sentences.length / 2);
	return [
		sentences.slice(0, mid).join("").trim(),
		sentences.slice(mid).join("").trim(),
	];
}

function LeadStory({ t, data }: { t: ReturnType<typeof useTranslations>; data: BriefingPayload }) {
	const summaryColumns = data.day.summary ? splitIntoColumns(data.day.summary) : [];
	return (
		<article className="gap-5 flex flex-col">
			<h2 className="text-3xl font-bold md:text-[2.7rem] font-news leading-[1.05] tracking-[-0.01em]">
				{data.lead}
			</h2>
			{summaryColumns.length > 0 && (
				<div
					className={cn(
						"gap-x-10 gap-y-3 text-lg leading-relaxed font-serif text-brand-ink/85 md:text-xl",
						summaryColumns.length > 1 && "grid grid-cols-1 md:grid-cols-2",
					)}
				>
					{summaryColumns.map((para) => (
						<p key={para} className="text-justify">
							{para}
						</p>
					))}
				</div>
			)}
			{data.day.agenda.length > 0 && (
				<div className="p-5 rounded-block border-2 border-brand-ink/12">
					<p className={cn(EYEBROW, "mb-3")}>{t("agenda")}</p>
					{/* CSS columns, not grid: grid rows stretch to the tallest item,
					    leaving holes under short items when a neighbor wraps. */}
					<ul className="gap-x-2.5 sm:columns-2">
						{data.day.agenda.map((item) => (
							<li
								key={item}
								className="gap-2.5 mb-2.5 flex break-inside-avoid font-serif text-brand-ink/85 last:mb-0"
							>
								<span
									aria-hidden
									className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-ink/40"
								/>
								<span className="leading-snug">{item}</span>
							</li>
						))}
					</ul>
				</div>
			)}
		</article>
	);
}

function SectionRule({ children }: { children: React.ReactNode }) {
	return (
		<div className="gap-3 flex items-center">
			<h3 className="text-xl font-bold tracking-wide font-news uppercase">{children}</h3>
			<div className="h-px flex-1 bg-brand-ink/20" />
		</div>
	);
}

function HeroStory({ t, item }: { t: ReturnType<typeof useTranslations>; item: BriefingNewsItem }) {
	return (
		<article className="gap-4 flex flex-col">
			<NewsImage
				src={item.image}
				className="aspect-[16/9] w-full rounded-block object-cover"
			/>
			<div className="gap-3 flex flex-col">
				<span className={EYEBROW}>{item.source}</span>
				<h4 className="text-2xl font-semibold leading-snug md:text-3xl font-news text-balance">
					{item.title}
				</h4>
				{item.why && (
					<p className="text-lg leading-relaxed font-serif text-brand-ink/80">
						{item.why}
					</p>
				)}
				<ReadButton url={item.url} label={t("read")} />
			</div>
		</article>
	);
}

function NewsCard({ t, item }: { t: ReturnType<typeof useTranslations>; item: BriefingNewsItem }) {
	return (
		<article className="gap-3 flex flex-col">
			<NewsImage
				src={item.image}
				className="aspect-video w-full rounded-block object-cover"
			/>
			<span className={EYEBROW}>{item.source}</span>
			<h4 className="text-xl font-semibold leading-snug font-news text-balance">
				{item.title}
			</h4>
			{item.why && <p className="leading-relaxed font-serif text-brand-ink/75">{item.why}</p>}
			<ReadButton url={item.url} label={t("read")} />
		</article>
	);
}

function OnThisDay({
	t,
	item,
}: {
	t: ReturnType<typeof useTranslations>;
	item: BriefingOnThisDay | null;
}) {
	if (!item) return null;
	return (
		<section className="p-5 rounded-block bg-paper-sunk/50">
			<p className={cn(EYEBROW, "mb-2 gap-1.5 flex items-center")}>
				<ClockIcon className="size-3.5" />
				{t("onThisDay")}
			</p>
			<Link href={item.href} className="group gap-1.5 flex flex-col">
				<span className="text-xs font-medium text-brand-ink/50">{item.when}</span>
				<span className="text-lg font-semibold leading-snug font-news group-hover:underline">
					{item.title}
				</span>
				{item.excerpt && (
					<span className="text-sm leading-relaxed font-serif text-brand-ink/70">
						{item.excerpt}
					</span>
				)}
			</Link>
		</section>
	);
}

function ComposingState({ t }: { t: ReturnType<typeof useTranslations> }) {
	return (
		<div className="gap-3 py-20 flex flex-col items-center text-center">
			<div className="prompt-cycle text-2xl font-bold font-news">{t("composing")}</div>
			<p className="max-w-sm font-serif text-brand-ink/55">{t("composingHint")}</p>
		</div>
	);
}
