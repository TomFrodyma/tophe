"use client";

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@repo/ui/components/chart";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { formatMoney, formatMonthYear } from "../lib/format";

const chartConfig = {
	amount: {
		label: "Net / month",
		color: "var(--pop-primary)",
	},
} satisfies ChartConfig;

export function CareerSalaryChart() {
	const t = useTranslations("career");
	const { data: roles } = useQuery(orpc.career.roles.list.queryOptions());

	if (!roles) {
		return null;
	}

	const points = roles
		.flatMap((role) =>
			role.salaries.map((s) => ({
				date: s.effectiveDate,
				amount: Number(s.amount),
				currency: s.currency,
				label: s.label,
				company: role.company,
				title: role.title,
			})),
		)
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	if (points.length < 2) {
		return null;
	}

	const data = points.map((p) => ({
		month: formatMonthYear(p.date),
		amount: p.amount,
		company: p.company,
	}));

	const currency = points[0]?.currency ?? "EUR";

	return (
		<section className="gap-3 flex flex-col">
			<div className="gap-1 flex flex-col">
				<h2 className="text-lg font-bold tracking-[-0.01em]">{t("salary.title")}</h2>
				<p className="text-sm text-muted-foreground">{t("salary.subtitle")}</p>
			</div>
			<ChartContainer config={chartConfig} className="h-56 w-full">
				<AreaChart
					accessibilityLayer
					data={data}
					margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
				>
					<defs>
						<linearGradient id="career-salary" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="var(--color-amount)" stopOpacity={0.35} />
							<stop offset="100%" stopColor="var(--color-amount)" stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid vertical={false} />
					<XAxis
						dataKey="month"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						minTickGap={16}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						width={56}
						tickFormatter={(v) => formatMoney(v, currency)}
					/>
					<ChartTooltip
						content={
							<ChartTooltipContent
								formatter={(value) => formatMoney(value as number, currency)}
							/>
						}
					/>
					<Area
						dataKey="amount"
						type="stepAfter"
						fill="url(#career-salary)"
						stroke="var(--color-amount)"
						strokeWidth={2}
						dot={{ r: 3, fill: "var(--color-amount)" }}
					/>
				</AreaChart>
			</ChartContainer>
		</section>
	);
}
