"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, PlusIcon, SparklesIcon, TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface NextStepInsight {
	title: string;
	rationale: string;
	timeframe: "NOW" | "SHORT_TERM" | "LONG_TERM";
	effort: "LOW" | "MEDIUM" | "HIGH";
}

export function AiInsightsPanel() {
	const t = useTranslations("career");
	const queryClient = useQueryClient();
	const { data: profile } = useQuery(orpc.career.profile.get.queryOptions());

	const generateMutation = useMutation(orpc.career.insights.generate.mutationOptions());
	const addStepMutation = useMutation(orpc.career.nextSteps.create.mutationOptions());

	const insights = generateMutation.data ?? profile?.insights ?? null;

	const onGenerate = async () => {
		try {
			await generateMutation.mutateAsync({});
			await queryClient.invalidateQueries({
				queryKey: orpc.career.profile.get.queryKey(),
			});
		} catch (err) {
			toastError(err instanceof Error && err.message ? err.message : t("insights.error"));
		}
	};

	const onAddStep = async (step: NextStepInsight) => {
		try {
			await addStepMutation.mutateAsync({
				text: step.title,
				detail: step.rationale,
				timeframe: step.timeframe,
				source: "AI",
			});
			await queryClient.invalidateQueries({
				queryKey: orpc.career.nextSteps.list.queryKey(),
			});
			toastSuccess(t("insights.addedStep"));
		} catch {
			toastError(t("form.saveError"));
		}
	};

	return (
		<Card className="gap-4 p-5 flex flex-col">
			<div className="gap-3 flex items-start justify-between">
				<div className="gap-1 flex flex-col">
					<h2 className="gap-2 text-lg font-bold flex items-center tracking-[-0.01em]">
						<SparklesIcon className="size-4 text-pop-primary" />
						{t("insights.title")}
					</h2>
					<p className="text-sm text-muted-foreground">{t("insights.subtitle")}</p>
				</div>
				<Button
					onClick={onGenerate}
					loading={generateMutation.isPending}
					variant={insights ? "outline" : "primary"}
					size="sm"
				>
					<SparklesIcon className="size-4" />
					{insights ? t("insights.regenerate") : t("insights.generate")}
				</Button>
			</div>

			{!insights && !generateMutation.isPending && (
				<p className="text-sm text-muted-foreground">{t("insights.empty")}</p>
			)}

			{insights && (
				<div className="gap-4 flex flex-col">
					<p className="text-sm leading-relaxed">{insights.summary}</p>

					<div className="gap-4 sm:grid-cols-2 grid">
						<div className="gap-2 flex flex-col">
							<h3 className="gap-1.5 text-xs font-semibold flex items-center tracking-[0.14em] text-muted-foreground uppercase">
								<CheckIcon className="size-3.5" />
								{t("insights.strengths")}
							</h3>
							<ul className="gap-1 flex flex-col">
								{insights.strengths.map((s) => (
									<li key={s} className="text-sm leading-relaxed">
										{s}
									</li>
								))}
							</ul>
						</div>
						<div className="gap-2 flex flex-col">
							<h3 className="gap-1.5 text-xs font-semibold flex items-center tracking-[0.14em] text-muted-foreground uppercase">
								<TriangleAlertIcon className="size-3.5" />
								{t("insights.watchOuts")}
							</h3>
							<ul className="gap-1 flex flex-col">
								{insights.watchOuts.map((w) => (
									<li key={w} className="text-sm leading-relaxed">
										{w}
									</li>
								))}
							</ul>
						</div>
					</div>

					<div className="gap-2 flex flex-col">
						<h3 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
							{t("insights.nextSteps")}
						</h3>
						<ul className="gap-2 flex flex-col">
							{insights.nextSteps.map((step) => (
								<li
									key={step.title}
									className="gap-3 p-3 flex items-start justify-between rounded-lg border border-border/60"
								>
									<div className="min-w-0 gap-1 flex flex-col">
										<div className="gap-2 flex flex-wrap items-center">
											<span className="font-medium text-sm">
												{step.title}
											</span>
											<Badge>
												{t(`insights.timeframe.${step.timeframe}`)}
											</Badge>
											<Badge status="success">
												{t(`insights.effort.${step.effort}`)}
											</Badge>
										</div>
										<p className="text-sm leading-relaxed text-muted-foreground">
											{step.rationale}
										</p>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="shrink-0"
										onClick={() => onAddStep(step)}
									>
										<PlusIcon className="size-4" />
										{t("insights.addStep")}
									</Button>
								</li>
							))}
						</ul>
					</div>

					{profile?.insightsGeneratedAt && !generateMutation.data && (
						<p className="text-xs text-muted-foreground">
							{t("insights.generatedAt", {
								date: new Date(profile.insightsGeneratedAt).toLocaleString(),
							})}
						</p>
					)}
				</div>
			)}
		</Card>
	);
}
