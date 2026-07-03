"use client";

import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { useLocaleCurrency } from "@shared/hooks/locale-currency";
import { useFormatter } from "next-intl";
import { type PropsWithChildren, useMemo } from "react";

export function StatsTile({
	title,
	value,
	context,
	trend,
	valueFormat,
	children,
}: PropsWithChildren<{
	title: string;
	value: number;
	valueFormat: "currency" | "number" | "percentage";
	context?: string;
	icon?: React.ReactNode;
	trend?: number;
}>) {
	const format = useFormatter();
	const localeCurrency = useLocaleCurrency();

	const formattedValue = useMemo(() => {
		if (valueFormat === "currency") {
			return format.number(value, {
				style: "currency",
				currency: localeCurrency,
			});
		}
		if (valueFormat === "percentage") {
			return format.number(value, {
				style: "percent",
			});
		}
		return format.number(value);
	}, [value, valueFormat, format, localeCurrency]);

	const formattedTrend = useMemo(() => {
		if (!trend) {
			return null;
		}
		return `${trend >= 0 ? "+" : ""}${format.number(trend, {
			style: "percent",
		})}`;
	}, [trend, format]);

	return (
		<Card>
			<CardHeader className="gap-3 p-8 pb-4">
				<p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-60">
					{title}
				</p>
			</CardHeader>
			<CardContent className="p-8 pt-0">
				<div className="flex items-baseline justify-between gap-4">
					<strong className="text-4xl font-extrabold leading-none tracking-[-0.03em] lg:text-5xl">
						{formattedValue}
						{context && (
							<small className="ml-1 text-base font-medium opacity-60">
								{context}
							</small>
						)}
					</strong>
					{trend && (
						<Badge status={trend > 0 ? "success" : "error"}>{formattedTrend}</Badge>
					)}
				</div>
				{children ? <div className="mt-6 w-full">{children}</div> : null}
			</CardContent>
		</Card>
	);
}
