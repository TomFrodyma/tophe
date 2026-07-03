"use client";

import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Spinner } from "@repo/ui/components/spinner";
import { toastError } from "@repo/ui/components/toast";
import { useAgentName } from "@ai/hooks/use-agent-name";
import { orpcClient } from "@shared/lib/orpc-client";
import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Period = "WEEK" | "MONTH" | "YEAR";

export function JournalSummaryPanel() {
	const t = useTranslations("journal.summary");
	const agentName = useAgentName();
	const [period, setPeriod] = useState<Period>("WEEK");
	const [busy, setBusy] = useState(false);
	const [text, setText] = useState("");
	const [meta, setMeta] = useState<{ entryCount: number; period: Period } | null>(null);

	async function generate() {
		if (busy) {
			return;
		}
		setBusy(true);
		setText("");
		setMeta(null);
		try {
			// The procedure yields one `meta` event, then a `delta` per chunk;
			// appending each delta re-renders the markdown, so it types in live.
			const stream = await orpcClient.journal.summarize({ period });
			for await (const event of stream) {
				if (event.type === "meta") {
					setMeta({ entryCount: event.entryCount, period });
				} else {
					setText((prev) => prev + event.text);
				}
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : t("error");
			toastError(message || t("error"));
		} finally {
			setBusy(false);
		}
	}

	return (
		<Card className="gap-4 p-5 flex flex-col">
			<div className="gap-2 flex flex-col">
				<div className="gap-2 flex items-center">
					<SparklesIcon className="size-5 text-primary" />
					<h3 className="font-semibold text-lg">{t("title")}</h3>
				</div>
				<p className="text-sm text-muted-foreground">
					{t("description", { name: agentName })}
				</p>
			</div>

			<div className="gap-2 flex flex-wrap items-end">
				<div className="gap-1.5 flex flex-col">
					<label className="text-xs text-muted-foreground">{t("period")}</label>
					<Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
						<SelectTrigger className="min-w-[160px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="WEEK">{t("periods.WEEK")}</SelectItem>
							<SelectItem value="MONTH">{t("periods.MONTH")}</SelectItem>
							<SelectItem value="YEAR">{t("periods.YEAR")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<Button
					variant="primary"
					loading={busy}
					disabled={busy}
					onClick={() => void generate()}
				>
					<SparklesIcon className="size-4" />
					{t("generate")}
				</Button>
			</div>

			{busy && !text && (
				<div className="gap-2 py-4 flex items-center text-muted-foreground text-sm">
					<Spinner className="size-4" />
					{t("generating", { name: agentName })}
				</div>
			)}

			{(text || meta) && (
				<div className="gap-3 pt-2 flex flex-col border-t">
					{meta && (
						<p className="text-xs text-muted-foreground">
							{t("meta", { count: meta.entryCount, period: t(`periods.${meta.period}`) })}
						</p>
					)}
					<div className="text-sm leading-relaxed">
						<ReactMarkdown
							remarkPlugins={[remarkGfm]}
							components={{
								h1: ({ children }) => (
									<h1 className="mt-5 mb-2 font-semibold text-xl">{children}</h1>
								),
								h2: ({ children }) => (
									<h2 className="mt-5 mb-2 font-semibold text-lg">{children}</h2>
								),
								h3: ({ children }) => (
									<h3 className="mt-4 mb-2 font-semibold text-base">{children}</h3>
								),
								p: ({ children }) => <p className="my-2">{children}</p>,
								ul: ({ children }) => (
									<ul className="my-2 gap-1 pl-5 flex list-disc flex-col">{children}</ul>
								),
								ol: ({ children }) => (
									<ol className="my-2 gap-1 pl-5 flex list-decimal flex-col">
										{children}
									</ol>
								),
								li: ({ children }) => <li className="leading-relaxed">{children}</li>,
								strong: ({ children }) => (
									<strong className="font-semibold text-foreground">{children}</strong>
								),
								em: ({ children }) => <em className="italic">{children}</em>,
								hr: () => <hr className="my-4 border-border" />,
								blockquote: ({ children }) => (
									<blockquote className="my-2 border-l-2 border-border pl-4 text-muted-foreground italic">
										{children}
									</blockquote>
								),
								code: ({ children }) => (
									<code className="rounded bg-muted px-1 py-0.5 text-xs">{children}</code>
								),
								a: ({ href, children }) => (
									<a
										href={href}
										target="_blank"
										rel="noreferrer"
										className="text-primary underline underline-offset-2"
									>
										{children}
									</a>
								),
							}}
						>
							{text}
						</ReactMarkdown>
					</div>
				</div>
			)}
		</Card>
	);
}
