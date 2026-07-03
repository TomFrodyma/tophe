"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Spinner } from "@repo/ui/components/spinner";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { BriefcaseIcon, PencilIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { formatDuration, formatMoney, formatRoleRange } from "../lib/format";

interface Salary {
	effectiveDate: string;
	amount: string;
	currency: string;
}

function latestSalary(salaries: Salary[]): Salary | null {
	if (salaries.length === 0) {
		return null;
	}
	return salaries
		.slice()
		.sort(
			(a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime(),
		)[0]!;
}

export function CareerTimeline() {
	const t = useTranslations("career");
	const { data: roles, isLoading } = useQuery(orpc.career.roles.list.queryOptions());

	if (isLoading) {
		return (
			<div className="py-12 flex items-center justify-center">
				<Spinner className="size-5" />
			</div>
		);
	}

	if (!roles || roles.length === 0) {
		return (
			<Card className="gap-3 py-12 flex flex-col items-center justify-center text-center">
				<BriefcaseIcon className="size-8 text-muted-foreground" />
				<h3 className="font-medium text-lg">{t("timeline.empty.title")}</h3>
				<p className="max-w-md text-sm text-muted-foreground">
					{t("timeline.empty.description")}
				</p>
				<Button asChild className="mt-2">
					<Link href="/career/roles/new">
						<PlusIcon className="size-4" />
						{t("timeline.empty.cta")}
					</Link>
				</Button>
			</Card>
		);
	}

	return (
		<section className="gap-4 flex flex-col">
			<div className="gap-3 flex items-center justify-between">
				<h2 className="text-lg font-bold tracking-[-0.01em]">{t("timeline.title")}</h2>
				<Button asChild variant="ghost" size="sm">
					<Link href="/career/roles/new">
						<PlusIcon className="size-4" />
						{t("timeline.addRole")}
					</Link>
				</Button>
			</div>

			<ol className="relative flex flex-col">
				{roles.map((role, index) => {
					const salary = latestSalary(role.salaries);
					const isCurrent = role.endDate === null;
					const isLast = index === roles.length - 1;
					return (
						<li key={role.id} className="gap-4 pb-6 last:pb-0 relative flex">
							{/* rail */}
							<div className="w-4 relative flex shrink-0 justify-center">
								<span
									className="top-1.5 size-3 absolute rounded-full ring-4 ring-paper"
									style={{ backgroundColor: "var(--pop-primary)" }}
									aria-hidden
								/>
								{!isLast && (
									<span
										className="top-5 bottom-0 absolute w-px bg-border"
										aria-hidden
									/>
								)}
							</div>

							<Card className="group gap-3 p-5 flex flex-1 flex-col">
								<div className="gap-3 flex items-start justify-between">
									<div className="min-w-0 flex flex-col">
										<div className="gap-2 flex flex-wrap items-center">
											<h3 className="font-semibold text-base">
												{role.title}
											</h3>
											{isCurrent && (
												<Badge status="success">
													{t("timeline.current")}
												</Badge>
											)}
										</div>
										<span className="text-sm text-muted-foreground">
											{role.company}
											{role.location ? ` · ${role.location}` : ""}
										</span>
										<span className="text-xs text-muted-foreground">
											{formatRoleRange(role.startDate, role.endDate)}
											{` · ${formatDuration(role.startDate, role.endDate)}`}
										</span>
									</div>
									<div className="gap-3 flex shrink-0 items-start">
										{salary && (
											<div className="flex flex-col items-end">
												<span className="font-semibold tabular-nums">
													{formatMoney(salary.amount, salary.currency)}
												</span>
												<span className="text-xs text-muted-foreground">
													{t("overview.netMonthly")}
												</span>
											</div>
										)}
										<Button
											asChild
											variant="ghost"
											size="icon"
											className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
										>
											<Link
												href={`/career/roles/${role.id}`}
												aria-label={t("timeline.editRole")}
											>
												<PencilIcon className="size-4" />
											</Link>
										</Button>
									</div>
								</div>

								{role.summary && (
									<p className="text-sm leading-relaxed text-pretty opacity-90">
										{role.summary}
									</p>
								)}

								{role.highlights.length > 0 && (
									<ul className="gap-1.5 flex flex-col">
										{role.highlights.map((h) => (
											<li key={h.id} className="gap-2.5 text-sm flex items-baseline">
												{h.metric ? (
													<span className="shrink-0 font-semibold tabular-nums whitespace-nowrap text-pop-primary">
														{h.metric}
													</span>
												) : (
													<span className="shrink-0 text-muted-foreground/60" aria-hidden>
														·
													</span>
												)}
												<span className="leading-relaxed text-pretty opacity-90">{h.text}</span>
											</li>
										))}
									</ul>
								)}
							</Card>
						</li>
					);
				})}
			</ol>
		</section>
	);
}
