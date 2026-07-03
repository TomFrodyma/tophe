"use client";

import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui";
import { useTranslations } from "next-intl";

import type { CalendarView } from "../lib/date-utils";

interface ViewSwitcherProps {
	value: CalendarView;
	onChange: (v: CalendarView) => void;
	hideMonth?: boolean;
}

const VIEWS: CalendarView[] = ["MONTH", "DAY", "AGENDA"];

export function ViewSwitcher({ value, onChange, hideMonth }: ViewSwitcherProps) {
	const t = useTranslations("calendar");
	const views = hideMonth ? VIEWS.filter((v) => v !== "MONTH") : VIEWS;
	return (
		<div className="rounded-lg border bg-card inline-flex p-0.5">
			{views.map((v) => (
				<Button
					key={v}
					type="button"
					variant="ghost"
					size="sm"
					className={cn(
						"h-8 px-2.5 text-sm",
						value === v
							? "bg-accent text-foreground font-medium"
							: "text-muted-foreground hover:text-foreground",
					)}
					onClick={() => onChange(v)}
				>
					{t(`views.${v}`)}
				</Button>
			))}
		</div>
	);
}
