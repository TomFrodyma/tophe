"use client";

import { Card } from "@repo/ui/components/card";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { formatDuration, formatMoney, formatMonthYear } from "../lib/format";

interface SalaryPoint {
	effectiveDate: string;
	amount: string;
	currency: string;
}

function latestAndFirstSalary(roles: { salaries: SalaryPoint[] }[]): {
	first: SalaryPoint | null;
	latest: SalaryPoint | null;
} {
	const all = roles
		.flatMap((r) => r.salaries)
		.slice()
		.sort((a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime());
	return { first: all[0] ?? null, latest: all[all.length - 1] ?? null };
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
	return (
		<Card className="gap-1 p-5 flex flex-col">
			<span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
				{label}
			</span>
			<span className="text-2xl font-extrabold tracking-[-0.02em] tabular-nums">{value}</span>
			{hint && <span className="text-xs text-muted-foreground">{hint}</span>}
		</Card>
	);
}

export function CareerOverview() {
	const t = useTranslations("career");
	const { data: roles } = useQuery(orpc.career.roles.list.queryOptions());

	if (!roles || roles.length === 0) {
		return null;
	}

	const current = roles.find((r) => r.endDate === null) ?? roles[0]!;
	const { first, latest } = latestAndFirstSalary(roles);

	let growth: string | null = null;
	if (first && latest && Number(first.amount) > 0) {
		const pct = ((Number(latest.amount) - Number(first.amount)) / Number(first.amount)) * 100;
		growth = `${pct >= 0 ? "+" : ""}${Math.round(pct)}%`;
	}

	return (
		<div className="gap-3 lg:grid-cols-4 grid grid-cols-2">
			<Stat label={t("overview.current")} value={current.title} hint={current.company} />
			<Stat
				label={t("overview.salary")}
				value={latest ? formatMoney(latest.amount, latest.currency) : "-"}
				hint={latest ? t("overview.netMonthly") : undefined}
			/>
			<Stat
				label={t("overview.growth")}
				value={growth ?? "-"}
				hint={first ? t("overview.sinceStart") : undefined}
			/>
			<Stat
				label={t("overview.tenure")}
				value={formatDuration(current.startDate, current.endDate)}
				hint={t("overview.tenureSince", { date: formatMonthYear(current.startDate) })}
			/>
		</div>
	);
}
